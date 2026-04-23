"""ArticlePipeline — оркестратор генерации и публикации статьи."""

import re
from .config import Config
from .image_generator import ImageGenerator
from .models import MediaItem, PipelineInput, PublishResult
from .text_generator import TextGenerator
from .validators import validate_prompt, validate_publish_at
from .wordpress_client import WordPressClient


def _insert_images_into_body(body: str, media_items: list[MediaItem]) -> str:
    """Вставляет изображения в тело статьи после H2 заголовков."""
    if not media_items:
        return body

    # Находим все позиции закрывающих тегов </h2>
    h2_ends = [m.end() for m in re.finditer(r'</h2>', body, re.IGNORECASE)]

    # Вставляем картинки после 1-го и 2-го H2 (если есть)
    insert_positions = h2_ends[:len(media_items)]

    # Если H2 меньше чем картинок — вставляем оставшиеся в конец
    result = body
    offset = 0
    for i, media in enumerate(media_items):
        img_html = (
            f'\n<figure style="margin:24px 0;text-align:center">'
            f'<img src="{media.url}" alt="Иллюстрация {i+1}" '
            f'style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1)" />'
            f'</figure>\n'
        )
        if i < len(insert_positions):
            pos = insert_positions[i] + offset
            result = result[:pos] + img_html + result[pos:]
            offset += len(img_html)
        else:
            result += img_html

    return result


class ArticlePipeline:
    """Оркестрирует все шаги: валидация → генерация текста → генерация изображений → публикация."""

    def __init__(self, config: Config) -> None:
        self._config = config
        self._text_generator = TextGenerator(api_key=config.gemini_api_key)
        self._image_generator = ImageGenerator()
        self._wp_client = WordPressClient(
            wp_url=config.wp_url,
            wp_username=config.wp_username,
            wp_app_password=config.wp_app_password,
        )

    def run(self, input: PipelineInput) -> PublishResult:
        """Запустить пайплайн генерации и публикации статьи.

        Шаги:
        1. Валидация промта
        2. Валидация даты публикации (если задана)
        3. Генерация статьи через TextGenerator
        4. Генерация изображений через ImageGenerator
        5. Загрузка каждого изображения в WordPress
        6. Создание записи в WordPress

        Returns:
            PublishResult с post_id, post_url, status, scheduled_at.

        Raises:
            ValidationError: если промт пустой или дата в прошлом.
            TextGenerationError: при ошибке Gemini API.
            ImageGenerationError: если все изображения не удалось сгенерировать.
            WordPressAuthError: при ошибке аутентификации WordPress.
            WordPressError: при других ошибках WordPress API.
        """
        # 1. Валидация промта
        validate_prompt(input.prompt)

        # 2. Валидация даты публикации (только если задана)
        if input.publish_at is not None:
            validate_publish_at(input.publish_at)

        # 3. Генерация статьи
        article = self._text_generator.generate(input.prompt)

        # 4. Генерация изображений
        prompts = article.image_prompts[: input.image_count]
        images = self._image_generator.generate(prompts)

        # 5. Загрузка изображений в WordPress
        media_items = []
        for i, image in enumerate(images):
            ext = "png" if image.mime_type == "image/png" else "jpg"
            filename = f"image_{i + 1}.{ext}"
            media_item = self._wp_client.upload_media(image, filename)
            media_items.append(media_item)

        media_ids = [m.id for m in media_items]
        featured_media_id = media_ids[0]

        # Вставляем картинки в тело статьи — после первого и второго H2
        body_with_images = _insert_images_into_body(article.body, media_items)
        article.body = body_with_images

        # 6. Создание записи в WordPress
        result = self._wp_client.create_post(
            article=article,
            media_ids=media_ids,
            featured_media_id=featured_media_id,
            categories=input.categories,
            tags=input.tags,
            publish_at=input.publish_at,
        )

        return result
