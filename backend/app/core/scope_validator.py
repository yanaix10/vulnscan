import asyncio
import logging
import time
from typing import Any, Optional
from urllib.parse import urlparse
import httpx

logger = logging.getLogger("vulnscan.scope")


class OutOfScopeError(Exception):
    """Raised when an operation attempts to target an unauthorized URL."""
    pass


class ScopeValidator:
    """
    Guarantees requests only hit explicitly approved hosts and enforces rate limits.
    """

    def __init__(
        self,
        allowed_hosts: list[str],
        rate_limit_per_sec: float = 5.0,
        allow_subdomains: bool = False,
    ):
        # Normalize allowed hosts to lowercase stripped strings without schemes or ports
        self.allowed_hosts = {self._extract_host(h) for h in allowed_hosts if h}
        self.rate_limit_per_sec = rate_limit_per_sec
        self.allow_subdomains = allow_subdomains
        self.min_interval = 1.0 / rate_limit_per_sec if rate_limit_per_sec > 0 else 0.0
        self._last_request_time = 0.0
        self._lock = asyncio.Lock()

    @staticmethod
    def _extract_host(target: str) -> str:
        """Extracts and normalizes the host from a domain, IP, or full URL."""
        target = target.strip().lower()
        if not target.startswith(("http://", "https://")):
            target = f"http://{target}"
        parsed = urlparse(target)
        return (parsed.hostname or "").lower()

    def is_in_scope(self, url: str) -> bool:
        """Evaluates whether the given URL strictly falls within authorized scope."""
        target_host = self._extract_host(url)
        if not target_host:
            return False

        if target_host in self.allowed_hosts:
            return True

        if self.allow_subdomains:
            for allowed in self.allowed_hosts:
                if target_host.endswith(f".{allowed}"):
                    return True

        return False

    def is_allowed(self, url: str) -> bool:
        """Exposes is_allowed(url) as required by the build guide."""
        return self.is_in_scope(url)

    def assert_in_scope(self, url: str) -> None:
        """Raises OutOfScopeError if the URL does not belong to authorized scope."""
        if not self.is_in_scope(url):
            logger.warning(f"BLOCKED OUT-OF-SCOPE ATTEMPT: {url}")
            raise OutOfScopeError(f"Rejected: Target '{url}' is outside authorized scope.")

    async def acquire_rate_limit(self) -> None:
        """Throttles execution to satisfy the configured requests-per-second ceiling."""
        if self.min_interval <= 0:
            return

        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_request_time
            sleep_duration = self.min_interval - elapsed
            if sleep_duration > 0:
                await asyncio.sleep(sleep_duration)
            self._last_request_time = time.monotonic()


class ScopedHttpClient:
    """
    Async HTTP client wrapper enforcing scope boundaries and rate limits.
    All crawler and plugin requests must pass through this wrapper.
    """

    def __init__(
        self,
        scope: ScopeValidator,
        timeout: float = 10.0,
        follow_redirects: bool = False,
        custom_headers: Optional[dict[str, str]] = None,
    ):
        self.scope = scope
        self.timeout = timeout
        self.follow_redirects = follow_redirects
        self.custom_headers = custom_headers or {}
        self._client: Optional[httpx.AsyncClient] = None

    async def __aenter__(self):
        headers = {
            "User-Agent": "VulnScan/1.0 (Defensive Security Scanner; Authorized Audit)",
            **self.custom_headers,
        }
        self._client = httpx.AsyncClient(
            timeout=self.timeout,
            follow_redirects=self.follow_redirects,
            headers=headers,
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._client:
            await self._client.aclose()
            self._client = None

    async def request(self, method: str, url: str, **kwargs: Any) -> httpx.Response:
        """Checks scope, enforces rate limit, and executes request."""
        # 1. Reject unapproved hosts immediately
        self.scope.assert_in_scope(url)

        # 2. Enforce rate limit delay
        await self.scope.acquire_rate_limit()

        if not self._client:
            raise RuntimeError("ScopedHttpClient must be accessed as an async context manager.")

        # 3. Execute HTTP transaction
        response = await self._client.request(method, url, **kwargs)

        # 4. Scope-check HTTP redirects if the server responds with a 3xx Location header
        if response.is_redirect and "location" in response.headers:
            redirect_target = response.headers["location"]
            if redirect_target.startswith(("http://", "https://")):
                if self._client.follow_redirects:
                    self.scope.assert_in_scope(redirect_target)
        return response

    async def get(self, url: str, **kwargs: Any) -> httpx.Response:
        return await self.request("GET", url, **kwargs)

    async def post(self, url: str, **kwargs: Any) -> httpx.Response:
        return await self.request("POST", url, **kwargs)
