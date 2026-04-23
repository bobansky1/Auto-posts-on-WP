"""FastAPI backend for the AI Article Generator web UI."""

from __future__ import annotations

import sys
import os

# Загружаем .env — ищем от текущей директории вверх
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(usecwd=True))

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src'))

from datetime import datetime
from typing import Literal, Optional

import urllib3
urllib3.disable_warnings()

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from routers.auth_router import router as auth_router
from routers.history_router import router as history_router
from database import get_db
from models import Publication, User

from ai_article_generator.config import Config
from ai_article_generator.image_generator import ImageGenerationError
from ai_article_generator.models import PipelineInput
from ai_article_generator.pipeline import ArticlePipeline
from ai_article_generator.text_generator import TextGenerationError
from ai_article_generator.validators import ValidationError
from ai_article_generator.wordpress_client import WordPressAuthError, WordPressError


class GenerateRequest(BaseModel):
    prompt: str
    wp_url: str
    wp_username: str
    wp_app_password: str
    openrouter_api_key: str
    openrouter_model: str = "openai/gpt-4o-mini"
    publish_at: Optional[str] = None
    categories: list[int] = []
    tags: list[str] = []
    image_count: Literal[2, 3] = 2


class GenerateResponse(BaseModel):
    post_url: str
    status: str


app = FastAPI()

app.include_router(auth_router)
app.include_router(history_router)


@app.on_event("startup")
async def startup():
    from database import engine, Base
    import models  # noqa: F401 — ensure models are registered
    Base.metadata.create_all(bind=engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/categories")
async def get_categories(wp_url: str, wp_username: str, wp_app_password: str):
    """Fetch categories from WordPress site."""
    import base64
    import requests as req
    import urllib3
    urllib3.disable_warnings()

    base_url = wp_url.rstrip("/")
    creds = base64.b64encode(f"{wp_username}:{wp_app_password}".encode()).decode()
    headers = {"Authorization": f"Basic {creds}"}
    try:
        r = req.get(
            f"{base_url}/wp-json/wp/v2/categories?per_page=100",
            headers=headers, verify=False, timeout=10
        )
        r.raise_for_status()
        return [{"id": c["id"], "name": c["name"]} for c in r.json()]
    except Exception as exc:
        return JSONResponse(status_code=502, content={"error": str(exc)})


oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


@app.post("/api/generate", response_model=GenerateResponse)
async def generate(
    request: GenerateRequest,
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db),
):
    publish_at: Optional[datetime] = None
    if request.publish_at:
        try:
            publish_at = datetime.fromisoformat(request.publish_at)
        except ValueError:
            return JSONResponse(status_code=422, content={"error": f"Invalid publish_at: {request.publish_at!r}"})

    config = Config(
        wp_url=request.wp_url,
        wp_username=request.wp_username,
        wp_app_password=request.wp_app_password,
        gemini_api_key=request.openrouter_api_key,
    )

    from ai_article_generator.text_generator import TextGenerator

    pipeline = ArticlePipeline(config)
    # Переопределяем модель из запроса
    pipeline._text_generator = TextGenerator(api_key=request.openrouter_api_key, model=request.openrouter_model)

    pipeline_input = PipelineInput(
        prompt=request.prompt,
        image_count=request.image_count,
        categories=request.categories,
        tags=request.tags,
        publish_at=publish_at,
    )

    try:
        result = pipeline.run(pipeline_input)
    except ValidationError as exc:
        return JSONResponse(status_code=422, content={"error": str(exc)})
    except WordPressAuthError as exc:
        return JSONResponse(status_code=401, content={"error": str(exc)})
    except (TextGenerationError, ImageGenerationError, WordPressError) as exc:
        return JSONResponse(status_code=502, content={"error": str(exc)})
    except Exception as exc:
        return JSONResponse(status_code=500, content={"error": str(exc)})

    # Сохраняем запись в БД если пользователь авторизован
    if token:
        try:
            from auth import decode_access_token
            payload = decode_access_token(token)
            user_id = payload.get("sub")
            if user_id:
                publication = Publication(
                    user_id=int(user_id),
                    prompt=request.prompt,
                    post_url=result.post_url,
                    status=result.status,
                    wp_url=request.wp_url,
                )
                db.add(publication)
                db.commit()
        except Exception:
            pass  # Не прерываем ответ из-за ошибки сохранения истории

    return GenerateResponse(post_url=result.post_url, status=result.status)
