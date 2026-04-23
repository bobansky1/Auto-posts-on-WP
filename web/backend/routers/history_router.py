"""History router: publication history endpoints."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Publication, User
from schemas import PublicationCreate, PublicationOut

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=List[PublicationOut], status_code=status.HTTP_200_OK)
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[PublicationOut]:
    """Return publications for the current user, sorted by created_at DESC."""
    publications = (
        db.query(Publication)
        .filter(Publication.user_id == current_user.id)
        .order_by(Publication.created_at.desc())
        .all()
    )
    return publications


@router.post("", response_model=PublicationOut, status_code=status.HTTP_200_OK)
def add_history(
    entry: PublicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PublicationOut:
    """Add a publication record for the current user."""
    publication = Publication(
        user_id=current_user.id,
        prompt=entry.prompt,
        post_url=entry.post_url,
        status=entry.status,
        wp_url=entry.wp_url,
    )
    db.add(publication)
    db.commit()
    db.refresh(publication)
    return publication


@router.delete("", status_code=status.HTTP_200_OK)
def delete_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Delete all publications for the current user."""
    db.query(Publication).filter(Publication.user_id == current_user.id).delete()
    db.commit()
    return {"detail": "History cleared"}
