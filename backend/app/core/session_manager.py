from dataclasses import dataclass
from typing import Optional
from app.core.scope_validator import ScopedHttpClient


@dataclass
class AuthConfig:
    login_url: Optional[str] = None
    username_field: str = "username"
    password_field: str = "password"
    username: Optional[str] = None
    password: Optional[str] = None
    session_cookie: Optional[str] = None
    bearer_token: Optional[str] = None


class AuthSessionManager:
    """Authenticates the ScopedHttpClient before crawling begins."""

    def __init__(self, config: AuthConfig, client: ScopedHttpClient):
        self.config = config
        self.client = client

    async def login(self) -> bool:
        """Applies headers/cookies or executes a form login."""
        
        applied = False

        # 1. Inject Bearer Token
        if self.config.bearer_token:
            token = self.config.bearer_token.strip()
            if not token.lower().startswith("bearer "):
                token = f"Bearer {token}"
            self.client.custom_headers["Authorization"] = token
            if self.client._client:
                self.client._client.headers["Authorization"] = token
            applied = True

        # 2. Inject Static Cookie
        if self.config.session_cookie:
            self.client.custom_headers["Cookie"] = self.config.session_cookie
            if self.client._client:
                self.client._client.headers["Cookie"] = self.config.session_cookie
            applied = True

        # 3. Dynamic Form Login
        if self.config.login_url and self.config.username and self.config.password:
            try:
                payload = {
                    self.config.username_field: self.config.username,
                    self.config.password_field: self.config.password,
                }
                
                # The httpx AsyncClient automatically persists received Set-Cookie headers
                response = await self.client.post(self.config.login_url, data=payload)
                
                # Assume success if we get a 3xx redirect to a dashboard or a 200 OK
                if response.status_code in (200, 302, 303):
                    return True
            except Exception:
                return False
                
        return applied
