from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.database import get_db
from app.modules.helpdesk.router import router


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

def sample_ticket():
    return {
        "raised_by": "John Doe",
        "category": "Technical",
        "priority": "High",
        "description": "Getting an invalid credentials error.",
        "assigned_to": None,
    }


def test_create_ticket():
    response = client.post(
        "/helpdesk/tickets",
        json=sample_ticket(),
    )

    assert response.status_code == 201

    data = response.json()

    assert data["raised_by"] == sample_ticket()["raised_by"]
    assert data["category"] == sample_ticket()["category"]
    assert data["priority"] == sample_ticket()["priority"]
    assert data["description"] == sample_ticket()["description"]
    assert data["status"] == "Open"

    assert "ticket_id" in data

def test_get_all_tickets():
    client.post("/helpdesk/tickets", json=sample_ticket())

    response = client.get("/helpdesk/tickets")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_ticket_by_id():
    create_response = client.post(
        "/helpdesk/tickets",
        json=sample_ticket(),
    )

    ticket_id = create_response.json()["ticket_id"]

    response = client.get(f"/helpdesk/tickets/{ticket_id}")

    assert response.status_code == 200
    assert response.json()["ticket_id"] == ticket_id


def test_update_ticket_status():
    create_response = client.post(
        "/helpdesk/tickets",
        json=sample_ticket(),
    )

    ticket_id = create_response.json()["ticket_id"]

    response = client.patch(
        f"/helpdesk/tickets/{ticket_id}/status",
        json={"status": "In Progress"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "In Progress"


def test_add_comment():
    create_response = client.post(
        "/helpdesk/tickets",
        json=sample_ticket(),
    )

    ticket_id = create_response.json()["ticket_id"]

    response = client.post(
        f"/helpdesk/tickets/{ticket_id}/comments",
        json={
            "author_id": "John Doe",
            "comment": "Issue is being investigated.",
        },
    )

    assert response.status_code == 201
    assert response.json()["ticket_id"] == ticket_id
    assert response.json()["comment"] == "Issue is being investigated."


def test_get_invalid_ticket():
    response = client.get("/helpdesk/tickets/9999")

    assert response.status_code == 404