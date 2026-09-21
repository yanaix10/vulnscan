import time
import pytest
from app.core.scope_validator import ScopeValidator, ScopedHttpClient, OutOfScopeError


def test_scope_exact_host_matching():
    validator = ScopeValidator(allowed_hosts=["staging.local", "127.0.0.1"])

    assert validator.is_in_scope("http://staging.local/dashboard") is True
    assert validator.is_allowed("http://staging.local/dashboard") is True
    assert validator.is_in_scope("https://staging.local:8080/api/v1") is True
    assert validator.is_in_scope("http://127.0.0.1:3000/") is True

    # Out of scope
    assert validator.is_in_scope("http://malicious.com") is False
    assert validator.is_allowed("http://malicious.com") is False
    assert validator.is_in_scope("http://evil-staging.local") is False
    assert validator.is_in_scope("https://sub.staging.local") is False


def test_scope_subdomain_matching():
    validator = ScopeValidator(allowed_hosts=["example.com"], allow_subdomains=True)

    assert validator.is_in_scope("https://example.com") is True
    assert validator.is_in_scope("https://api.example.com/v1") is True
    assert validator.is_in_scope("https://dev.auth.example.com") is True
    assert validator.is_in_scope("https://notexample.com") is False


@pytest.mark.asyncio
async def test_scoped_http_client_blocks_out_of_scope_without_network():
    validator = ScopeValidator(allowed_hosts=["authorized.local"])

    async with ScopedHttpClient(scope=validator) as client:
        with pytest.raises(OutOfScopeError) as exc_info:
            await client.get("http://unauthorized.target.com/admin")

        assert "outside authorized scope" in str(exc_info.value)


@pytest.mark.asyncio
async def test_rate_limiter_enforces_interval():
    validator = ScopeValidator(allowed_hosts=["localhost"], rate_limit_per_sec=2.0)

    start = time.monotonic()
    await validator.acquire_rate_limit()
    await validator.acquire_rate_limit()
    elapsed = time.monotonic() - start

    assert elapsed >= 0.45, f"Expected elapsed time >= 0.45s, got {elapsed}s"
