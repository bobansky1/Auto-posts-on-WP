"""WordPress REST API client for uploading media and creating posts."""

from __future__ import annotations

import base64
from datetime import datetime
from typing import Optional

import requests
from slugify import slugify
from transliterate import translit

from .models import Article, ImageData, MediaItem, PublishResult


def _make_slug(title: str) -> str:
    """Транслитерирует русский заголовок и делает slug."""
    try:
        latin = translit(title, "ru", reversed=True)
    except Exception:
        latin = title
    return slugify(latin)


class WordPressError(Exception):
    """Raised when WordPress API returns an error."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        self.status_code = status_code
        super().__init__(message)


class WordPressAuthError(WordPressError):
    """Raised when WordPress API returns HTTP 401 (authentication failure)."""

    def __init__(self):
        super().__init__(
            "WordPress authentication failed. Check wp_username and wp_app_password.",
            status_code=401,
        )


class WordPressClient:
    """Client for WordPress REST API."""

    def __init__(self, wp_url: str, wp_username: str, wp_app_password: str):
        self._base_url = wp_url.rstrip("/")
        credentials = f"{wp_username}:{wp_app_password}"
        token = base64.b64encode(credentials.encode()).decode()
        self._headers = {"Authorization": f"Basic {token}"}

    def _raise_for_response(self, response: requests.Response) -> None:
        """Raise appropriate exception based on HTTP status code."""
        if response.status_code == 401:
            raise WordPressAuthError()
        if not response.ok:
            raise WordPressError(
                f"WordPress API error {response.status_code}: {response.text}",
                status_code=response.status_code,
            )

    def upload_media(self, image: ImageData, filename: str) -> MediaItem:
        """Upload an image to the WordPress media library.

        Retries once on failure. Raises WordPressAuthError on 401,
        WordPressError on other errors.
        """
        url = f"{self._base_url}/wp-json/wp/v2/media"
        headers = {
            **self._headers,
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": image.mime_type,
        }

        last_error: Optional[Exception] = None
        for attempt in range(2):  # initial attempt + 1 retry
            try:
                response = requests.post(
                    url,
                    headers=headers,
                    data=image.content,
                    verify=False,
                )
                self._raise_for_response(response)
                data = response.json()
                return MediaItem(id=data["id"], url=data["source_url"])
            except WordPressAuthError:
                raise  # don't retry auth errors
            except (WordPressError, requests.RequestException) as exc:
                last_error = exc
                if attempt == 0:
                    continue  # retry once

        raise WordPressError(f"Failed to upload media after retry: {last_error}") from last_error

    def create_post(
        self,
        article: Article,
        media_ids: list[int],
        featured_media_id: int,
        categories: list[int],
        tags: list[str],
        publish_at: Optional[datetime] = None,
    ) -> PublishResult:
        """Create a WordPress post.

        Status is 'future' if publish_at is provided, otherwise 'publish'.
        Raises WordPressAuthError on 401, WordPressError on other errors.
        """
        status = "future" if publish_at is not None else "publish"

        payload: dict = {
            "title": article.title,
            "slug": _make_slug(article.title),
            "content": article.body,
            "excerpt": article.meta_description,
            "status": status,
            "featured_media": featured_media_id,
            "categories": categories,
            "tags_input": tags,
            "meta": {
                "_yoast_wpseo_title": article.title,
                "_yoast_wpseo_metadesc": article.meta_description,
            },
        }

        if publish_at is not None:
            payload["date"] = publish_at.isoformat()

        url = f"{self._base_url}/wp-json/wp/v2/posts"
        response = requests.post(url, json=payload, headers=self._headers, verify=False)
        self._raise_for_response(response)

        data = response.json()
        post_id = data["id"]

        # Yoast SEO мета через отдельный POST на /wp-json/wp/v2/posts/{id}
        # Yoast регистрирует свои поля как protected, поэтому используем прямой update
        self._update_yoast_meta(post_id, article.title, article.meta_description)

        return PublishResult(
            post_id=post_id,
            post_url=data["link"],
            status=data["status"],
            scheduled_at=publish_at,
        )

    def _update_yoast_meta(self, post_id: int, seo_title: str, meta_description: str) -> None:
        """Обновить Yoast SEO мета через REST API."""
        import logging
        url = f"{self._base_url}/wp-json/wp/v2/posts/{post_id}"
        payload = {
            "meta": {
                "_yoast_wpseo_title": seo_title,
                "_yoast_wpseo_metadesc": meta_description,
            }
        }
        response = requests.post(url, json=payload, headers=self._headers, verify=False)
        if not response.ok:
            logging.getLogger(__name__).warning(
                "Yoast meta update failed (%s): %s", response.status_code, response.text[:200]
            )

    def _update_yoast_via_indexables(self, post_id: int, seo_title: str, meta_description: str) -> None:
        """Обновить Yoast через indexables endpoint."""
        import logging
        log = logging.getLogger(__name__)
        url = f"{self._base_url}/wp-json/yoast/v1/indexables"
        payload = {
            "object_id": post_id,
            "object_type": "post",
            "title": seo_title,
            "description": meta_description,
        }
        response = requests.post(url, json=payload, headers=self._headers, verify=False)
        if not response.ok:
            log.warning("Yoast indexables update failed (%s): %s", response.status_code, response.text[:200])
