"""TextGenerator — генерация статьи через OpenRouter API."""

import json

import requests

from .models import Article


class TextGenerationError(Exception):
    """Raised when text generation fails due to API error or invalid response."""


_SYSTEM_PROMPT = """\
You are a professional SEO content writer. Generate a long-form, high-quality article based on the user's topic.

STRICT REQUIREMENTS:
- Minimum 1500 words in the body (aim for 2000+)
- Body must be rich HTML with proper structure and inline styles for visual appeal
- Use varied content blocks: intro paragraph, multiple H2/H3 sections, bullet lists, numbered lists, blockquotes, a summary table where relevant, and a conclusion
- Each H2 section must have at least 2-3 paragraphs
- Use inline styles for visual interest: colored blockquotes, styled tables, highlighted key points

HTML STRUCTURE EXAMPLE:
<h2 style="color:#2c3e50;border-bottom:2px solid #3498db;padding-bottom:8px;">Section Title</h2>
<p>Detailed paragraph text...</p>
<blockquote style="border-left:4px solid #3498db;padding:12px 20px;background:#f0f7ff;margin:20px 0;font-style:italic;">
  Key insight or quote here
</blockquote>
<ul style="line-height:2">
  <li><strong>Point 1</strong> — explanation</li>
</ul>
<table style="width:100%;border-collapse:collapse;margin:20px 0">
  <tr style="background:#3498db;color:white"><th style="padding:10px">Col1</th><th style="padding:10px">Col2</th></tr>
  <tr style="background:#f8f9fa"><td style="padding:10px;border:1px solid #dee2e6">...</td><td style="padding:10px;border:1px solid #dee2e6">...</td></tr>
</table>

Return ONLY a valid JSON object (no markdown, no extra text) with exactly these fields:
- "title": string — compelling article title
- "body": string — full HTML article body, minimum 1500 words
- "meta_description": string — SEO meta description, 150-160 characters
- "image_prompts": array of 2-3 strings — detailed prompts for generating illustrations
"""

_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
_DEFAULT_MODEL = "openai/gpt-4o-mini"  # ~$0.15 за 1000 запросов


def _repair_truncated_json(raw: str) -> str:
    """Пытается восстановить обрезанный JSON — закрывает незакрытые строки и скобки."""
    # Обрезаем до последнего валидного поля body если оно есть
    # Стратегия: найти все открытые { и [ и закрыть их
    result = raw.rstrip()

    # Считаем незакрытые кавычки (нечётное число = незакрытая строка)
    in_string = False
    escape_next = False
    for ch in result:
        if escape_next:
            escape_next = False
            continue
        if ch == '\\':
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string

    # Если строка не закрыта — закрываем её
    if in_string:
        result += '"'

    # Закрываем незакрытые скобки
    stack = []
    in_string = False
    escape_next = False
    for ch in result:
        if escape_next:
            escape_next = False
            continue
        if ch == '\\' and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if not in_string:
            if ch in '{[':
                stack.append('}' if ch == '{' else ']')
            elif ch in '}]' and stack:
                stack.pop()

    result += ''.join(reversed(stack))
    return result


class TextGenerator:
    def __init__(self, api_key: str, model: str = _DEFAULT_MODEL) -> None:
        self._api_key = api_key
        self._model = model

    def generate(self, prompt: str) -> Article:
        """Call OpenRouter API and return an Article.

        Raises:
            TextGenerationError: On API error or invalid/incomplete JSON response.
        """
        try:
            response = requests.post(
                _OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self._model,
                    "max_tokens": 20000,
                    "messages": [
                        {"role": "system", "content": _SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                },
                timeout=60,
            )
            response.raise_for_status()
            raw = response.json()["choices"][0]["message"]["content"].strip()
        except TextGenerationError:
            raise
        except Exception as exc:
            raise TextGenerationError(f"OpenRouter API error: {exc}") from exc

        # Strip accidental markdown fences if the model adds them anyway
        if raw.startswith("```"):
            lines = raw.splitlines()
            raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            # Модель могла обрезать JSON — пробуем восстановить
            raw = _repair_truncated_json(raw)
            try:
                data = json.loads(raw)
            except json.JSONDecodeError as exc:
                raise TextGenerationError(f"Invalid JSON in OpenRouter response: {exc}") from exc

        missing = [f for f in ("title", "body", "meta_description", "image_prompts") if f not in data]
        if missing:
            raise TextGenerationError(f"Missing fields in OpenRouter response: {missing}")

        image_prompts = data["image_prompts"]
        if not isinstance(image_prompts, list) or not (2 <= len(image_prompts) <= 3):
            raise TextGenerationError(
                f"image_prompts must be a list of 2-3 strings, got: {image_prompts!r}"
            )

        return Article(
            title=str(data["title"]),
            body=str(data["body"]),
            meta_description=str(data["meta_description"]),
            image_prompts=[str(p) for p in image_prompts],
        )
