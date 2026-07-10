from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.modules.m0_employee.models import Base
from app.modules.training.database import get_db
from app.modules.training.router import router


# In-memory SQLite database used only for API tests.
TEST_DATABASE_URL = "sqlite://"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


app = FastAPI()
app.include_router(router)


def override_get_db():
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_create_training_program():
    response = client.post(
        "/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["program_id"] == 1
    assert data["name"] == "Python Full Stack Development"


def test_list_training_programs():
    client.post(
        "/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    response = client.get("/training/programs")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Python Full Stack Development"


def test_duplicate_training_program():
    request_body = {
        "name": "Python Full Stack Development",
    }

    client.post(
        "/training/programs",
        json=request_body,
    )

    response = client.post(
        "/training/programs",
        json=request_body,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "A training program with this name already exists."
    )


def test_create_training_unit():
    program_response = client.post(
        "/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    program_id = program_response.json()["program_id"]

    response = client.post(
        f"/training/programs/{program_id}/units",
        json={
            "name": "Python Basics",
            "sequence": 1,
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["program_id"] == program_id
    assert data["name"] == "Python Basics"
    assert data["sequence"] == 1


def test_list_training_units():
    program_response = client.post(
        "/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    program_id = program_response.json()["program_id"]

    client.post(
        f"/training/programs/{program_id}/units",
        json={
            "name": "Advanced Python",
            "sequence": 2,
        },
    )

    client.post(
        f"/training/programs/{program_id}/units",
        json={
            "name": "Python Basics",
            "sequence": 1,
        },
    )

    response = client.get(
        f"/training/programs/{program_id}/units"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert data[0]["sequence"] == 1
    assert data[1]["sequence"] == 2


def test_duplicate_unit_sequence():
    program_response = client.post(
        "/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    program_id = program_response.json()["program_id"]

    request_body = {
        "name": "Python Basics",
        "sequence": 1,
    }

    client.post(
        f"/training/programs/{program_id}/units",
        json=request_body,
    )

    response = client.post(
        f"/training/programs/{program_id}/units",
        json={
            "name": "Another Unit",
            "sequence": 1,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "A unit with this sequence already exists in the program."
    )


def test_unit_for_missing_program():
    response = client.post(
        "/training/programs/99999/units",
        json={
            "name": "Test Unit",
            "sequence": 1,
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Training program not found."
    )