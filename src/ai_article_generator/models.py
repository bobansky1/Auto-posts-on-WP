from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class PipelineInput:
    """Входные данные для запуска пайплайна генерации и публикации статьи."""
    prompt: str
    image_count: int = 2
    categories: list[int] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    publish_at: Optional[datetime] = None
    gemini_model: str = "gemini-1.5-flash"
    image_width: int = 1200
    image_height: int = 630


@dataclass
class Article:
    """Сгенерированная статья."""
    title: str
    body: str
    meta_description: str
    image_prompts: list[str]


@dataclass
class ImageData:
    """Данные сгенерированного изображения."""
    content: bytes
    mime_type: str   # "image/jpeg" или "image/png"
    prompt: str      # промт, использованный для генерации


@dataclass
class MediaItem:
    """Медиафайл, загруженный в WordPress."""
    id: int
    url: str


@dataclass
class PublishResult:
    """Результат публикации статьи в WordPress."""
    post_id: int
    post_url: str
    status: str                          # "publish" или "future"
    scheduled_at: Optional[datetime] = None
