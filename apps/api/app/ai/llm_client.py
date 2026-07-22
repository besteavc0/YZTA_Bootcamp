from __future__ import annotations

import logging
import time

from openai import AsyncOpenAI
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings

logger = logging.getLogger("erpilot.ai.llm_client")

try:
    from openai import APIConnectionError, RateLimitError

    _RETRYABLE_EXCEPTIONS: tuple[type[Exception], ...] = (APIConnectionError, RateLimitError)
except ImportError:
    _RETRYABLE_EXCEPTIONS = (Exception,)


class LLMClient:
    def __init__(self, api_key: str | None = None):
        self._client = AsyncOpenAI(api_key=api_key or settings.OPENAI_API_KEY)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(_RETRYABLE_EXCEPTIONS),
        reraise=True,
    )
    async def complete(
        self,
        system_prompt: str,
        user_message: str,
        model: str | None = None,
    ) -> str:
        used_model = model or settings.OPENAI_MODEL
        started = time.monotonic()

        response = await self._client.chat.completions.create(
            model=used_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
        )

        elapsed = time.monotonic() - started
        usage = getattr(response, "usage", None)
        logger.info(
            "llm_complete model=%s elapsed=%.2fs tokens=%s",
            used_model,
            elapsed,
            getattr(usage, "total_tokens", "n/a"),
        )
        return response.choices[0].message.content or ""


llm_client = LLMClient()
