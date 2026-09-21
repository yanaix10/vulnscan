import asyncio
from collections import deque
from dataclasses import dataclass, field
import logging
from typing import Optional
from urllib.parse import parse_qs, urljoin, urlparse, urldefrag
from urllib.robotparser import RobotFileParser

from bs4 import BeautifulSoup
import httpx

from app.core.scope_validator import ScopedHttpClient, ScopeValidator, OutOfScopeError

logger = logging.getLogger("vulnscan.crawler")


@dataclass
class FormField:
    name: str
    field_type: str = "text"
    value: str = ""


@dataclass
class Form:
    action: str
    method: str = "GET"
    fields: list[FormField] = field(default_factory=list)


@dataclass
class DiscoveredPage:
    url: str
    status_code: int
    content_type: str
    headers: dict[str, str]
    body: str
    links: list[str] = field(default_factory=list)
    query_params: list[str] = field(default_factory=list)
    forms: list[Form] = field(default_factory=list)


class Crawler:
    """
    Asynchronous web crawler supporting both static HTTP parsing and 
    headless browser rendering for SPAs (Angular/React/Vue).
    """

    def __init__(
        self,
        client: ScopedHttpClient,
        max_depth: int = 3,
        max_pages: int = 50,
        respect_robots: bool = False,
        use_spa: bool = False,
    ):
        self.client = client
        self.scope: ScopeValidator = client.scope
        self.max_depth = max_depth
        self.max_pages = max_pages
        self.respect_robots = respect_robots
        self.use_spa = use_spa
        self.robot_parser: Optional[RobotFileParser] = None

    def _normalize_url(self, base_url: str, link: str, preserve_hash: bool = False) -> Optional[str]:
        """Resolves relative links and normalizes targets."""
        if not link:
            return None

        link = link.strip()
        full_url = urljoin(base_url, link)

        if not preserve_hash:
            clean_url, _ = urldefrag(full_url)
        else:
            clean_url = full_url

        parsed = urlparse(clean_url)
        if parsed.scheme not in ("http", "https"):
            return None

        ignored_extensions = (
            ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
            ".pdf", ".zip", ".tar", ".gz", ".mp4", ".mp3", ".woff", ".woff2"
        )
        if parsed.path.lower().endswith(ignored_extensions):
            return None

        # Ignore logout/signout and IDS toggles to prevent destroying or altering the active scan session
        ignored_keywords = ("logout", "log-out", "signout", "sign-out", "log_out", "phpids=on")
        if any(kw in clean_url.lower() for kw in ignored_keywords):
            return None

        return clean_url

    async def _init_robots(self, seed_url: str) -> None:
        parsed = urlparse(seed_url)
        robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
        self.robot_parser = RobotFileParser()
        try:
            response = await self.client.get(robots_url)
            if response.status_code == 200:
                self.robot_parser.parse(response.text.splitlines())
            else:
                self.robot_parser = None
        except (httpx.HTTPError, OutOfScopeError, Exception):
            self.robot_parser = None

    def _is_crawl_allowed(self, url: str) -> bool:
        if not self.scope.is_in_scope(url):
            return False

        if self.respect_robots and self.robot_parser:
            user_agent = self.client.custom_headers.get("User-Agent", "*")
            clean_url, _ = urldefrag(url)
            if not self.robot_parser.can_fetch(user_agent, clean_url):
                return False

        return True

    def _extract_page_data(self, page_url: str, html_text: str) -> tuple[list[str], list[str], list[Form]]:
        """Extracts links, parameters, forms, and client-side routes."""
        links: list[str] = []
        forms: list[Form] = []

        parsed_url = urlparse(page_url)
        query_params = list(parse_qs(parsed_url.query).keys())

        soup = BeautifulSoup(html_text, "html.parser")

        # 1. Standard href links and Angular/React hash routes
        for tag in soup.find_all(["a", "link"], href=True):
            href = tag["href"]
            preserve_hash = self.use_spa or href.startswith("#") or "/#" in href
            normalized = self._normalize_url(page_url, href, preserve_hash=preserve_hash)
            if normalized and self._is_crawl_allowed(normalized):
                links.append(normalized)

        # 2. Forms and interactive inputs
        for form_tag in soup.find_all("form"):
            action = form_tag.get("action", "")
            action_url = self._normalize_url(page_url, action, preserve_hash=self.use_spa) or page_url
            method = form_tag.get("method", "GET").upper()

            fields: list[FormField] = []
            has_submit = False
            for input_tag in form_tag.find_all(["input", "textarea", "select", "button"]):
                name = input_tag.get("name") or input_tag.get("id") or input_tag.get("formcontrolname")
                field_type = input_tag.get("type", "text").lower()
                value = input_tag.get("value", "")

                if field_type in ("submit", "button"):
                    has_submit = True
                    if not name:
                        name = "Submit"
                        value = value or "Submit"

                if not name:
                    continue
                fields.append(FormField(name=name, field_type=field_type, value=value))

            if not has_submit:
                fields.append(FormField(name="Submit", field_type="submit", value="Submit"))

            forms.append(Form(action=action_url, method=method, fields=fields))

        # 3. Fallback for un-nested form controls in Angular/React apps
        if not forms:
            standalone_inputs = soup.find_all(["input", "textarea"])
            if standalone_inputs:
                fields = []
                for inp in standalone_inputs:
                    name = inp.get("name") or inp.get("id") or inp.get("aria-label")
                    if name:
                        fields.append(FormField(name=name, field_type=inp.get("type", "text")))
                if fields:
                    forms.append(Form(action=page_url, method="POST", fields=fields))

        return list(set(links)), query_params, forms

    async def _render_spa_page(self, playwright, url: str) -> tuple[int, str, dict[str, str]]:
        """Spawns headless Chromium, dismisses modal overlays, and grabs hydrated DOM."""
        browser = await playwright.chromium.launch(headless=True)
        headers_to_forward = dict(self.client.custom_headers) if hasattr(self.client, "custom_headers") else {}
        context = await browser.new_context(ignore_https_errors=True, extra_http_headers=headers_to_forward)
        page = await context.new_page()

        status_code = 200
        headers: dict[str, str] = {}

        try:
            response = await page.goto(url, wait_until="networkidle", timeout=15000)
            if response:
                status_code = response.status
                headers = await response.all_headers()

            # Dismiss common overlay barriers
            dismiss_selectors = [
                "button[aria-label='Close Welcome Banner']",
                ".close-dialog",
                ".cc-dismiss",
                "button.mat-button-base",
                "text='Dismiss'",
            ]
            for selector in dismiss_selectors:
                try:
                    btn = page.locator(selector).first
                    if await btn.is_visible():
                        await btn.click(timeout=1000)
                        await page.wait_for_timeout(500)
                except Exception:
                    continue

            html_body = await page.content()
            return status_code, html_body, headers

        finally:
            await context.close()
            await browser.close()

    async def crawl(self, seed_url: str) -> list[DiscoveredPage]:
        """Executes the breadth-first crawl."""
        self.scope.assert_in_scope(seed_url)

        if self.respect_robots:
            await self._init_robots(seed_url)

        queue: deque[tuple[str, int]] = deque([(seed_url, 0)])
        visited: set[str] = set()
        pages: list[DiscoveredPage] = []

        playwright_driver = None
        if self.use_spa:
            try:
                from playwright.async_api import async_playwright
                playwright_driver = await async_playwright().start()
            except ImportError:
                logger.warning("Playwright is not installed. Falling back to HTTP crawler.")

        try:
            while queue and len(pages) < self.max_pages:
                current_url, depth = queue.popleft()

                if current_url in visited or depth > self.max_depth:
                    continue

                visited.add(current_url)

                try:
                    if self.use_spa and playwright_driver:
                        self.scope.assert_in_scope(current_url)
                        await self.scope.acquire_rate_limit()
                        status_code, body, headers = await self._render_spa_page(playwright_driver, current_url)
                        content_type = headers.get("content-type", "text/html")
                    else:
                        response = await self.client.get(current_url)
                        status_code = response.status_code
                        body = response.text
                        headers = dict(response.headers)
                        content_type = headers.get("content-type", "")

                except (httpx.HTTPError, OutOfScopeError, Exception) as e:
                    logger.warning(f"Failed to crawl {current_url}: {e}")
                    continue

                links, query_params, forms = self._extract_page_data(current_url, body)

                if depth < self.max_depth:
                    for link in links:
                        if link not in visited:
                            queue.append((link, depth + 1))

                pages.append(
                    DiscoveredPage(
                        url=current_url,
                        status_code=status_code,
                        content_type=content_type,
                        headers=headers,
                        body=body,
                        links=links,
                        query_params=query_params,
                        forms=forms,
                    )
                )

        finally:
            if playwright_driver:
                await playwright_driver.stop()

        return pages