"""Xkiro OpenAI-compatible LLM client with project defaults.

Defaults (edit at the top of this file):
  - BASE_URL       -> https://api.xkiro.com/v1
  - DEFAULT_MODEL  -> qwen/qwen3.8-max:free
  - API key        -> read from the XKIRO_API_KEY env var, or an ai/.env file

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
API_KEY_ENV = "XKIRO_API_KEY"
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


def get_client(api_key: str | None = None) -> OpenAI:
    """Build an OpenAI client with the project base_url and the resolved API key."""
    _load_dotenv()
    key = api_key or os.environ.get(API_KEY_ENV)
    if not key:
        raise ValueError(
            f"{API_KEY_ENV} is not set. Add it to your environment or to {_ENV_FILE}."
        )
    return OpenAI(api_key=key, base_url=BASE_URL)


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
