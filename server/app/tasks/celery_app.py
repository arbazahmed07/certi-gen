from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "certiflow_worker",
    broker=settings.broker_url,
    backend=settings.result_backend
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

celery_app.autodiscover_tasks(["app.tasks"])
