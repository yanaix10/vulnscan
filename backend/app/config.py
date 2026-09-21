from typing import Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./vulnscan.db"
    CORS_ORIGINS: Union[list[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://frontend-one-sepia-63.vercel.app"
    ]
    RATE_LIMIT: float = 5.0

    @field_validator("CORS_ORIGINS")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, list[str]]) -> list[str]:
        if isinstance(v, str):
            v_strip = v.strip()
            if v_strip.startswith("[") and v_strip.endswith("]"):
                import json
                try:
                    return json.loads(v_strip)
                except Exception:
                    pass
            if v_strip == "*":
                return ["*"]
            return [i.strip() for i in v_strip.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()