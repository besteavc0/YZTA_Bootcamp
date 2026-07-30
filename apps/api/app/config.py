from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "postgresql+asyncpg://erpilot:erpilot@postgres:5432/erpilot"
    REDIS_URL: str = "redis://redis:6379/0"

    OPENAI_API_KEY: str = "sk-changeme"
    OPENAI_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    SECRET_KEY: str = "changeme"
    CREDENTIAL_ENCRYPTION_KEY: str = "changeme"

    CLERK_SECRET_KEY: str = "sk_test_changeme"
    CLERK_JWKS_URL: str = "https://example.clerk.accounts.dev/.well-known/jwks.json"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
