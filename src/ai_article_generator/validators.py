from datetime import datetime, timezone


class ValidationError(Exception):
    """Raised when input validation fails."""
    pass


def validate_prompt(prompt: str) -> None:
    """Validate that prompt is not empty or whitespace-only.

    Raises:
        ValidationError: if prompt is empty or contains only whitespace characters.
    """
    if not prompt or not prompt.strip():
        raise ValidationError("Промт не может быть пустым или состоять только из пробельных символов.")


def validate_publish_at(dt: datetime) -> None:
    """Validate that publish_at datetime is in the future.

    If dt has no timezone info, it is treated as UTC.

    Raises:
        ValidationError: if dt is in the past relative to current UTC time.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    if dt < now:
        raise ValidationError("Дата публикации должна быть в будущем.")
