"""TASK-008: prompt loader ve LLM client testleri (OpenAI mock'lu)."""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.ai.prompt_loader import load_prompt


def test_load_prompt_returns_content():
    content = load_prompt("text_to_sql")
    assert "SELECT" in content
    assert "{schema}" in content
    assert "{examples}" in content


def test_load_prompt_missing_raises():
    with pytest.raises(FileNotFoundError):
        load_prompt("bu_prompt_yok")


@pytest.mark.asyncio
async def test_llm_complete_returns_string():
    from app.ai.llm_client import LLMClient

    fake_message = MagicMock()
    fake_message.content = "SELECT 1"
    fake_choice = MagicMock()
    fake_choice.message = fake_message
    fake_response = MagicMock()
    fake_response.choices = [fake_choice]
    fake_response.usage = MagicMock(total_tokens=42)

    client = LLMClient(api_key="sk-test")
    with patch.object(
        client._client.chat.completions,
        "create",
        new=AsyncMock(return_value=fake_response),
    ):
        result = await client.complete("system", "merhaba")
        assert result == "SELECT 1"
