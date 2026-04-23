"""Pydantic schemas for request/response validation."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PublicationOut(BaseModel):
    id: int
    prompt: str
    post_url: str
    status: str
    wp_url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PublicationCreate(BaseModel):
    prompt: str
    post_url: str
    status: str
    wp_url: str = ""
