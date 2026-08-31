"""OpenAI-compatible LLM client with configurable gateway.

Defaults:
  - BASE_URL       -> https://api.xkiro.com/v1
  - DEFAULT_MODEL  -> qwen/qwen3.8-max:free

Everything is overridable via env vars (no code edits needed to switch gateways):
  - LLM_BASE_URL   -> gateway base URL  (e.g. https://openrouter.ai/api/v1)
  - LLM_API_KEY    -> primary API key for that gateway
  - XKIRO_API_KEY  -> fallback API key (used if LLM_API_KEY is unset)

Keys can go in environment variables or in ai/.env (gitignored).

Usage:
  from ai.llm import chat
  print(chat("Hello!"))

  from ai.llm import get_client
  client = get_client()
"""
from __future__ import annotations

import os
from pathlib import Path

from openai import OpenAI

BASE_URL = "https://api.xkiro.com/v1"
DEFAULT_MODEL = "qwen/qwen3.8-max:free"
BASE_URL_ENV = "LLM_BASE_URL"
PRIMARY_KEY_ENV = "LLM_API_KEY"
FALLBACK_KEY_ENV = "XKIRO_API_KEY"
_ENV_FILE = Path(__file__).with_name(".env")


def _load_dotenv(path: Path = _ENV_FILE) -> None:
    """Minimal KEY=VALUE loader so we don't require python-dotenv at runtime."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\""))


def _resolve_key() -> str | None:
    return os.environ.get(PRIMARY_KEY_ENV) or os.environ.get(FALLBACK_KEY_ENV)


def get_client(api_key: str | None = None, base_url: str | None = None) -> OpenAI:
    """Build an OpenAI client with a resolved base_url and API key (env-overridable)."""
    _load_dotenv()
    key = api_key or _resolve_key()
    if not key:
        raise ValueError(
            f"no API key set. Set {PRIMARY_KEY_ENV} (or {FALLBACK_KEY_ENV}), or add it to {_ENV_FILE}."
        )
    url = base_url or os.environ.get(BASE_URL_ENV) or BASE_URL
    return OpenAI(api_key=key, base_url=url)


def chat(message: str, model: str = DEFAULT_MODEL, **kwargs) -> str:
    """Send a single user message and return the assistant's text reply."""
    client = get_client()
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": message}],
        **kwargs,
    )
    return resp.choices[0].message.content


def list_models() -> list[str]:
    """Return the model ids the gateway currently exposes."""
    client = get_client()
    return [m.id for m in client.models.list().data]


if __name__ == "__main__":
    # `python -m ai.llm` -> list the available models so you can pick one.
    print("\n".join(list_models()))
