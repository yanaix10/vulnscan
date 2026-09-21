import pytest
import respx
from app.core.scope_validator import ScopeValidator, ScopedHttpClient
from app.core.session_manager import AuthSessionManager, AuthConfig


@pytest.mark.asyncio
async def test_bearer_token_injection():
    config = AuthConfig(bearer_token="eyJhbGciOiJIUzI1NiI...")
    validator = ScopeValidator(["target.local"])

    async with ScopedHttpClient(validator) as client:
        auth = AuthSessionManager(config, client)
        await auth.login()

        assert client.custom_headers.get("Authorization") == "Bearer eyJhbGciOiJIUzI1NiI..."


@pytest.mark.asyncio
@respx.mock
async def test_dynamic_form_login():
    respx.post("http://target.local/login").respond(
        302, headers={"Set-Cookie": "session_id=secure_token; Path=/"}
    )

    config = AuthConfig(
        login_url="http://target.local/login",
        username="admin",
        password="password123"
    )
    validator = ScopeValidator(["target.local"])

    async with ScopedHttpClient(validator) as client:
        auth = AuthSessionManager(config, client)
        success = await auth.login()

        assert success is True
        assert "session_id" in client._client.cookies
