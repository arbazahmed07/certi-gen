from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter()


@router.get("/live", status_code=status.HTTP_200_OK)
def liveness_check():
    """Liveness probe: verifies process is alive."""
    return {"status": "alive", "service": "certiflow"}


@router.get("/ready", status_code=status.HTTP_200_OK)
def readiness_check(db: Session = Depends(get_db)):
    """Readiness probe: verifies database connection."""
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:
        db_status = f"unhealthy: {exc!s}"

    return {
        "status": "ready" if db_status == "connected" else "degraded",
        "database": db_status
    }
