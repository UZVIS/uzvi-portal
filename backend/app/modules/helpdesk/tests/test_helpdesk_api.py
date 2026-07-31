from datetime import datetime, timedelta

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.database import get_db
from app.modules.directory.models import Employee
from app.modules.helpdesk import router as helpdesk_router_module
from app.modules.helpdesk.dependencies import get_current_employee
from app.modules.helpdesk.models import Ticket
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


def _default_test_employee():
    """
    Every existing test below predates RBAC and calls the API with no
    auth header. The main `client` is defaulted to a privileged
    (HR-Restricted) identity so those tests keep exercising the same
    business logic as before. RBAC-specific tests further down use
    `raw_client`, which has no such override and goes through the real
    X-Employee-Id header check in dependencies.py.
    """
    return Employee(
        employee_id="TEST-HR",
        name="Test HR",
        access_tier="HR-Restricted",
        employment_status="active",
    )


app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_employee] = _default_test_employee

client = TestClient(app)

# Second app/client sharing the same in-memory DB but WITHOUT the auth
# override, so RBAC tests exercise the real header-parsing dependency.
raw_app = FastAPI()
raw_app.include_router(router)
raw_app.dependency_overrides[get_db] = override_get_db
raw_client = TestClient(raw_app)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_current_employee] = _default_test_employee

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
        "/api/helpdesk/tickets",
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
    client.post("/api/helpdesk/tickets", json=sample_ticket())

    response = client.get("/api/helpdesk/tickets")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_get_ticket_by_id():
    create_response = client.post(
        "/api/helpdesk/tickets",
        json=sample_ticket(),
    )

    ticket_id = create_response.json()["ticket_id"]

    response = client.get(f"/api/helpdesk/tickets/{ticket_id}")

    assert response.status_code == 200
    assert response.json()["ticket_id"] == ticket_id


def test_update_ticket_status():
    create_response = client.post(
        "/api/helpdesk/tickets",
        json=sample_ticket(),
    )

    ticket_id = create_response.json()["ticket_id"]

    response = client.patch(
        f"/api/helpdesk/tickets/{ticket_id}/status",
        json={"status": "In Progress"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "In Progress"


def test_add_comment():
    create_response = client.post(
        "/api/helpdesk/tickets",
        json=sample_ticket(),
    )

    ticket_id = create_response.json()["ticket_id"]

    response = client.post(
        f"/api/helpdesk/tickets/{ticket_id}/comments",
        json={
            "author_id": "John Doe",
            "comment": "Issue is being investigated.",
        },
    )

    assert response.status_code == 201
    assert response.json()["ticket_id"] == ticket_id
    assert response.json()["comment"] == "Issue is being investigated."


def test_get_invalid_ticket():
    response = client.get("/api/helpdesk/tickets/9999")

    assert response.status_code == 404


# --------------------------------------------------
# SLA Breach Flag Tests (FR-HLP-06)
# --------------------------------------------------


def test_new_ticket_is_not_sla_breached():
    response = client.post("/api/helpdesk/tickets", json=sample_ticket())

    assert response.status_code == 201
    assert response.json()["sla_breached"] is False


def backdate_ticket(ticket_id, hours_ago):
    """
    Directly set a ticket's created_at further in the past, so SLA-breach
    logic (which depends on real elapsed time) can be tested without
    waiting.
    """
    db = TestingSessionLocal()
    ticket = db.get(Ticket, ticket_id)
    ticket.created_at = datetime.utcnow() - timedelta(hours=hours_ago)
    db.commit()
    db.close()


def test_open_ticket_past_threshold_is_flagged_breached():
    # sample_ticket() has priority "High" -> 8 hour threshold.
    create_response = client.post(
        "/api/helpdesk/tickets", json=sample_ticket()
    )
    ticket_id = create_response.json()["ticket_id"]

    backdate_ticket(ticket_id, hours_ago=9)

    response = client.get(f"/api/helpdesk/tickets/{ticket_id}")

    assert response.status_code == 200
    assert response.json()["sla_breached"] is True


def test_resolved_ticket_past_threshold_is_not_flagged_breached():
    create_response = client.post(
        "/api/helpdesk/tickets", json=sample_ticket()
    )
    ticket_id = create_response.json()["ticket_id"]

    backdate_ticket(ticket_id, hours_ago=100)

    client.patch(
        f"/api/helpdesk/tickets/{ticket_id}/status",
        json={"status": "Resolved"},
    )

    response = client.get(f"/api/helpdesk/tickets/{ticket_id}")

    assert response.status_code == 200
    assert response.json()["sla_breached"] is False


# --------------------------------------------------
# Queue Filtering Tests (FR-HLP-05)
# --------------------------------------------------


def test_list_tickets_filter_by_category():
    client.post(
        "/api/helpdesk/tickets",
        json={**sample_ticket(), "category": "Hardware"},
    )
    client.post(
        "/api/helpdesk/tickets",
        json={**sample_ticket(), "category": "Software"},
    )

    response = client.get(
        "/api/helpdesk/tickets", params={"category": "Hardware"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["category"] == "Hardware"


def test_list_tickets_filter_by_priority():
    client.post(
        "/api/helpdesk/tickets",
        json={**sample_ticket(), "priority": "Low"},
    )
    client.post(
        "/api/helpdesk/tickets",
        json={**sample_ticket(), "priority": "High"},
    )

    response = client.get(
        "/api/helpdesk/tickets", params={"priority": "Low"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["priority"] == "Low"


def test_list_tickets_filter_by_min_age_hours():
    old_ticket = client.post(
        "/api/helpdesk/tickets", json=sample_ticket()
    ).json()
    client.post("/api/helpdesk/tickets", json=sample_ticket())

    backdate_ticket(old_ticket["ticket_id"], hours_ago=48)

    response = client.get(
        "/api/helpdesk/tickets", params={"min_age_hours": 24}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["ticket_id"] == old_ticket["ticket_id"]


# --------------------------------------------------
# Category Auto-Routing Tests (FR-HLP-02)
# --------------------------------------------------


def test_ticket_left_unassigned_when_category_has_no_configured_owner():
    response = client.post(
        "/api/helpdesk/tickets",
        json={**sample_ticket(), "category": "Hardware"},
    )

    assert response.status_code == 201
    assert response.json()["assigned_to"] is None


def test_ticket_auto_assigned_to_configured_category_owner(monkeypatch):
    monkeypatch.setitem(
        helpdesk_router_module.CATEGORY_DEFAULT_OWNERS,
        "Hardware",
        "EMP-IT-01",
    )

    response = client.post(
        "/api/helpdesk/tickets",
        json={**sample_ticket(), "category": "Hardware"},
    )

    assert response.status_code == 201
    assert response.json()["assigned_to"] == "EMP-IT-01"


def test_explicit_assigned_to_overrides_category_routing(monkeypatch):
    monkeypatch.setitem(
        helpdesk_router_module.CATEGORY_DEFAULT_OWNERS,
        "Hardware",
        "EMP-IT-01",
    )

    response = client.post(
        "/api/helpdesk/tickets",
        json={
            **sample_ticket(),
            "category": "Hardware",
            "assigned_to": "EMP-IT-02",
        },
    )

    assert response.status_code == 201
    assert response.json()["assigned_to"] == "EMP-IT-02"


# --------------------------------------------------
# RBAC Tests (NFR-SEC-01/02/03, FR-HLP-04, FR-HLP-05)
# --------------------------------------------------


def seed_employee(employee_id, access_tier="Employee"):
    db = TestingSessionLocal()
    db.add(
        Employee(
            employee_id=employee_id,
            name=f"Employee {employee_id}",
            access_tier=access_tier,
        )
    )
    db.commit()
    db.close()


def auth_headers(employee_id):
    return {"X-Employee-Id": employee_id}


def test_create_ticket_requires_auth_header():
    response = raw_client.post(
        "/api/helpdesk/tickets", json=sample_ticket()
    )

    assert response.status_code == 401


def test_create_ticket_rejects_unknown_employee_id():
    response = raw_client.post(
        "/api/helpdesk/tickets",
        json=sample_ticket(),
        headers=auth_headers("GHOST"),
    )

    assert response.status_code == 401


def test_employee_only_sees_own_tickets_in_queue():
    seed_employee("EMP001", access_tier="Employee")
    seed_employee("EMP002", access_tier="Employee")

    raw_client.post(
        "/api/helpdesk/tickets",
        json={**sample_ticket(), "raised_by": "EMP001"},
        headers=auth_headers("EMP001"),
    )
    raw_client.post(
        "/api/helpdesk/tickets",
        json={**sample_ticket(), "raised_by": "EMP002"},
        headers=auth_headers("EMP002"),
    )

    response = raw_client.get(
        "/api/helpdesk/tickets",
        headers=auth_headers("EMP001"),
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["raised_by"] == "EMP001"


def test_manager_sees_full_queue():
    seed_employee("EMP001", access_tier="Employee")
    seed_employee("EMP002", access_tier="Employee")
    seed_employee("MGR1", access_tier="Manager")

    raw_client.post(
        "/api/helpdesk/tickets",
        json={**sample_ticket(), "raised_by": "EMP001"},
        headers=auth_headers("EMP001"),
    )
    raw_client.post(
        "/api/helpdesk/tickets",
        json={**sample_ticket(), "raised_by": "EMP002"},
        headers=auth_headers("EMP002"),
    )

    response = raw_client.get(
        "/api/helpdesk/tickets",
        headers=auth_headers("MGR1"),
    )

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_employee_cannot_view_others_ticket_detail():
    seed_employee("EMP001", access_tier="Employee")
    seed_employee("EMP002", access_tier="Employee")

    ticket = raw_client.post(
        "/api/helpdesk/tickets",
        json={**sample_ticket(), "raised_by": "EMP002"},
        headers=auth_headers("EMP002"),
    ).json()

    response = raw_client.get(
        f"/api/helpdesk/tickets/{ticket['ticket_id']}",
        headers=auth_headers("EMP001"),
    )

    assert response.status_code == 403


def test_employee_can_view_own_ticket_detail():
    seed_employee("EMP001", access_tier="Employee")

    ticket = raw_client.post(
        "/api/helpdesk/tickets",
        json={**sample_ticket(), "raised_by": "EMP001"},
        headers=auth_headers("EMP001"),
    ).json()

    response = raw_client.get(
        f"/api/helpdesk/tickets/{ticket['ticket_id']}",
        headers=auth_headers("EMP001"),
    )

    assert response.status_code == 200


def test_assigned_owner_can_view_ticket_detail():
    seed_employee("EMP001", access_tier="Employee")
    seed_employee("IT1", access_tier="Employee")

    ticket = raw_client.post(
        "/api/helpdesk/tickets",
        json={
            **sample_ticket(),
            "raised_by": "EMP001",
            "assigned_to": "IT1",
        },
        headers=auth_headers("EMP001"),
    ).json()

    response = raw_client.get(
        f"/api/helpdesk/tickets/{ticket['ticket_id']}",
        headers=auth_headers("IT1"),
    )

    assert response.status_code == 200


def test_status_update_rejects_uninvolved_employee():
    seed_employee("EMP001", access_tier="Employee")
    seed_employee("IT1", access_tier="Employee")

    ticket = raw_client.post(
        "/api/helpdesk/tickets",
        json={
            **sample_ticket(),
            "raised_by": "EMP001",
            "assigned_to": "IT1",
        },
        headers=auth_headers("EMP001"),
    ).json()

    response = raw_client.patch(
        f"/api/helpdesk/tickets/{ticket['ticket_id']}/status",
        json={"status": "In Progress"},
        headers=auth_headers("EMP001"),
    )

    assert response.status_code == 403


def test_status_update_allows_assigned_owner():
    seed_employee("EMP001", access_tier="Employee")
    seed_employee("IT1", access_tier="Employee")

    ticket = raw_client.post(
        "/api/helpdesk/tickets",
        json={
            **sample_ticket(),
            "raised_by": "EMP001",
            "assigned_to": "IT1",
        },
        headers=auth_headers("EMP001"),
    ).json()

    response = raw_client.patch(
        f"/api/helpdesk/tickets/{ticket['ticket_id']}/status",
        json={"status": "In Progress"},
        headers=auth_headers("IT1"),
    )

    assert response.status_code == 200


def test_status_update_allows_manager():
    seed_employee("EMP001", access_tier="Employee")
    seed_employee("IT1", access_tier="Employee")
    seed_employee("MGR1", access_tier="Manager")

    ticket = raw_client.post(
        "/api/helpdesk/tickets",
        json={
            **sample_ticket(),
            "raised_by": "EMP001",
            "assigned_to": "IT1",
        },
        headers=auth_headers("EMP001"),
    ).json()

    response = raw_client.patch(
        f"/api/helpdesk/tickets/{ticket['ticket_id']}/status",
        json={"status": "Resolved"},
        headers=auth_headers("MGR1"),
    )

    assert response.status_code == 200