from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Central configuration for the Loom backend.

    Values can be overridden via environment variables. Field names are
    automatically uppercased when mapped from the environment, e.g.:

    - LOOM_APP_TITLE
    - LOOM_ALLOWED_ORIGINS
    - LOOM_BLUEPRINT_PATHS
    - LOOM_PLUGIN_PATHS
    """

    app_title: str = "Loom API"

    # Comma-separated list of allowed CORS origins.
    # In production, this MUST be overridden via the LOOM_ALLOWED_ORIGINS environment variable
    # to explicitly list the domains that are permitted to access the API.
    # e.g., LOOM_ALLOWED_ORIGINS="https://app.mycompany.com"
    allowed_origins: List[str] = [
        "*",
    ]

    # One or more directories (relative to the backend package root) to search
    # for YAML blueprints. This enables a core + project separation:
    #   - "blueprints"           → loom-core owned (User, Role — do not modify)
    #   - "blueprints_project"   → project-specific overrides (your domain models)
    # Override via: LOOM_BLUEPRINT_PATHS=blueprints,../my-project/blueprints
    blueprint_paths: List[str] = ["blueprints"]

    # Directories (relative or absolute) to search for backend plugins.
    # The plugin system can use this to discover plugin modules.
    plugin_paths: List[str] = ["plugins"]

    # Database configuration
    database_url: str = "sqlite:///./loom.db"

    # Security
    jwt_secret: str = "your-secret-key"

    # API Prefix
    api_prefix: str = "/v1"

    # Global Feature Flags
    enable_comments: bool = True
    enable_audit: bool = True

    # Execution Mode
    # "personal"      → fast iteration, loose RBAC, debug endpoints enabled, SQLite allowed
    # "organization"  → strict RBAC, audit enforced, debug endpoints disabled, Postgres required
    workspace_type: str = "personal"

    @property
    def is_org_mode(self) -> bool:
        return self.workspace_type == "organization"

    class Config:
        env_prefix = "LOOM_"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    Return a cached Settings instance.

    This is safe to import in modules like `main.py` and ensures that settings
    are only constructed once per process.
    """

    return Settings()
