"""Configuration tests that do not require real API credentials."""

from app.core.config import Settings


def test_settings_use_safe_defaults_without_api_keys() -> None:
    settings = Settings(
        _env_file=None,
        gemini_api_key=None,
        openrouter_api_key=None,
    )
    assert settings.app_env == "development"
    assert settings.log_level == "INFO"
    assert settings.gemini_api_key is None
    assert settings.openrouter_api_key is None
    assert settings.gemini_model == "gemini-3.8-flash"
    assert "http://localhost:5173" in settings.cors_origins
    assert "*" not in settings.cors_origins


def test_cors_origins_are_parsed_from_environment_string() -> None:
    settings = Settings(
        _env_file=None,
        cors_allowed_origins="http://localhost:4173, https://example.test ",
    )
    assert settings.cors_origins == [
        "http://localhost:4173",
        "https://example.test",
    ]
