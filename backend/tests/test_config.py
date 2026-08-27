"""Tests for the persistent JWT secret in app.config."""

import pytest

import app.config as config


@pytest.fixture
def fresh_config(tmp_path, monkeypatch):
    monkeypatch.delenv("JWT_SECRET", raising=False)
    monkeypatch.setattr(config, "_SECRET_FILE", tmp_path / ".jwt_secret")
    monkeypatch.setattr(config, "_jwt_secret", None)
    yield


def test_env_secret_takes_precedence(fresh_config, monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "env-secret-value")
    assert config.get_jwt_secret() == "env-secret-value"


def test_generates_and_persists_secret(fresh_config, tmp_path):
    secret = config.get_jwt_secret()
    assert secret
    assert len(secret) == 64
    assert (tmp_path / ".jwt_secret").read_text() == secret


def test_reuses_persisted_secret_across_process_restart(fresh_config, tmp_path):
    first = config.get_jwt_secret()
    config._jwt_secret = None
    second = config.get_jwt_secret()
    assert second == first
    assert (tmp_path / ".jwt_secret").read_text() == first
