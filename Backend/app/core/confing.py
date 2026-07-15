from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    SUPABASE_URL: str = "https://tcxse.co"
    SUPABASE_KEY: str = "sb_secret_QU"
    GOOGLE_API_KEY: str = "AIzaSyAp4CmSuPHWE"
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000" # הוספנו כדי שלא יקרוס 
    
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
