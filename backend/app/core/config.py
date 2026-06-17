from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Supports both repo-root `.env` and `backend/.env` (common when running uvicorn from repo root).
    model_config = SettingsConfigDict(env_file=(".env", "backend/.env"), extra="ignore")

    app_name: str = "ConstructHub"
    env: str = "dev"

    # For local dev you can use:
    # postgresql+psycopg://postgres:postgres@localhost:5432/constructhub
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/constructhub"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    jwt_secret_key: str = "dev-only-change-me"
    jwt_algorithm: str = "HS256"
    jwt_access_token_minutes: int = 60 * 24 * 7

    auto_create_db: bool = True

    # Simple dev-only admin access. Use an API key header `X-Admin-Key`.
    # Do NOT use this as-is in production.
    admin_api_key: str = "dev-admin-key-change-me"

    # AI provider:
    # - "offline": local heuristics + placeholder images (no external keys)
    # - "openai": real LLM description + real image generation (requires OPENAI_API_KEY)
    ai_provider: str = "offline"
    openai_api_key: str = ""
    openai_text_model: str = "gpt-4o-mini"
    openai_image_call_model: str = "gpt-5.5"
    openai_image_model: str = "gpt-image-1"
    openai_image_size: str = "1024x1024"
    openai_image_quality: str = "medium"
    gemini_api_key: str = ""
    gemini_text_model: str = "gemini-2.5-flash"
    gemini_image_model: str = "gemini-3.1-flash-image-preview"


settings = Settings()
