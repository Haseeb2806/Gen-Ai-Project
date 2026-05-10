from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check() -> dict[str, str]:
    """Return service health status for uptime checks."""
    return {"status": "ok"}
