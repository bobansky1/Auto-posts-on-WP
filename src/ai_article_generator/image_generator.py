"""ImageGenerator — генерация изображений через Pollinations.ai."""

import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import quote

import requests

from .models import ImageData

logger = logging.getLogger(__name__)

_BASE_URL = "https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&seed={seed}"


class ImageGenerationError(Exception):
    """Raised when all image generation requests fail."""


class ImageGenerator:
    def __init__(self, width: int = 1200, height: int = 630) -> None:
        self._width = width
        self._height = height

    def _fetch_one(self, prompt: str, index: int, retries: int = 3) -> ImageData:
        """Скачать одно изображение с retry."""
        encoded = quote(prompt, safe="")
        # seed разный для каждого изображения
        url = _BASE_URL.format(
            encoded_prompt=encoded,
            width=self._width,
            height=self._height,
            seed=index * 42 + 7,
        )
        last_exc: Exception = Exception("unknown")
        for attempt in range(retries):
            try:
                response = requests.get(url, timeout=90)
                response.raise_for_status()
                content_type = response.headers.get("Content-Type", "")
                mime_type = "image/png" if "image/png" in content_type else "image/jpeg"
                return ImageData(content=response.content, mime_type=mime_type, prompt=prompt)
            except Exception as exc:
                last_exc = exc
                if attempt < retries - 1:
                    time.sleep(2 * (attempt + 1))  # 2s, 4s между попытками
        raise last_exc

    def generate(self, prompts: list[str]) -> list[ImageData]:
        """Генерирует изображения параллельно через Pollinations.ai."""
        results: list[ImageData] = []

        # Параллельные запросы с небольшой задержкой между стартами
        with ThreadPoolExecutor(max_workers=len(prompts)) as executor:
            futures = {}
            for i, prompt in enumerate(prompts):
                time.sleep(i * 1.5)  # небольшая задержка чтобы не флудить
                futures[executor.submit(self._fetch_one, prompt, i)] = prompt
            for future in as_completed(futures):
                prompt = futures[future]
                try:
                    results.append(future.result())
                except Exception as exc:
                    logger.warning("Failed to generate image for prompt %r: %s", prompt, exc)

        if not results:
            raise ImageGenerationError(f"All {len(prompts)} image generation requests failed.")

        return results
