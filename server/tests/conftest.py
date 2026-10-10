import pytest
import os
import sys
from pathlib import Path

# Add server directory to sys.path
SERVER_DIR = Path(__file__).resolve().parent.parent
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Use isolated sqlite database for tests
TEST_DB_PATH = Path("./test_certiflow.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

import app.db.session as db_session_module
from app.db.base import Base
from app.db.session import get_db
from app.services.job_service import JobService
from app.main import app

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Patch SessionLocal across modules to use test db
db_session_module.SessionLocal = TestingSessionLocal
import app.tasks.generation_tasks as gen_tasks_module
gen_tasks_module.SessionLocal = TestingSessionLocal


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    JobService.AUTO_DISPATCH_BACKGROUND = False
    yield
    Base.metadata.drop_all(bind=test_engine)
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass


@pytest.fixture
def client():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
