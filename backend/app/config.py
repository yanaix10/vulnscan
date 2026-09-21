from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./vulnscan.db"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]  # React frontend defaults
    RATE_LIMIT: float = 5.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()