"""Configuration loader for AI Article Generator."""

from dataclasses import dataclass
from dotenv import load_dotenv
import os


class ConfigError(Exception):
    """Raised when a required configuration parameter is missing."""

    def __init__(self, param_name: str):
        self.param_name = param_name
        super().__init__(f"Missing required configuration parameter: {param_name}")


@dataclass
class Config:
    wp_url: str
    wp_username: str
    wp_app_password: str
    gemini_api_key: str


_REQUIRED_PARAMS = [
    ("WP_URL", "wp_url"),
    ("WP_USERNAME", "wp_username"),
    ("WP_APP_PASSWORD", "wp_app_password"),
    ("GEMINI_API_KEY", "gemini_api_key"),
]


def load_config() -> Config:
    """Load and validate configuration from .env file and environment variables.

    Raises:
        ConfigError: If any required parameter is missing.
    """
    load_dotenv()

    values: dict[str, str] = {}
    for env_key, field_name in _REQUIRED_PARAMS:
        value = os.environ.get(env_key)
        if not value:
            raise ConfigError(env_key)
        values[field_name] = value

    return Config(**values)
