from fastapi import APIRouter
from app.api.v1.endpoints import health, jobs, certificates, recipients

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(recipients.router, prefix="", tags=["Recipients"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["Certificates"])
