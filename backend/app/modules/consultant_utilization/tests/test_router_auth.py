
# from datetime import date

# import pytest
# from fastapi.testclient import TestClient
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker
# from sqlalchemy.pool import StaticPool

# from app.database import Base, get_db
# from app.main import app
# from app.modules.directory.models import Employee
# from app.modules.consultant_utilization import schemas, service


# @pytest.fixture
# def db_session():
#     engine = create_engine(
#         "sqlite:///:memory:",
#         connect_args={"check_same_thread": False},
#         poolclass=StaticPool,
#     )
#     Base.metadata.create_all(engine)
#     SessionLocal = sessionmaker(bind=engine)
#     session = SessionLocal()

#     def _get_db_override():
#         try:
#             yield session
#         finally:
#             pass

#     app.dependency_overrides[get_db] = _get_db_override
#     yield session
#     session.close()
#     app.dependency_overrides.clear()


# @pytest.fixture
# def client(db_session):
#     return TestClient(app)


# @pytest.fixture
# def employees(db_session):
#     admin = Employee(employee_id="ADM1", name="Admin One", access_tier="Admin/Leadership")
#     emp1 = Employee(employee_id="E1", name="Employee One", access_tier="Employee")
#     emp2 = Employee(employee_id="E2", name="Employee Two", access_tier="Employee")
#     db_session.add_all([admin, emp1, emp2])
#     db_session.commit()
#     return {"admin": admin, "emp1": emp1, "emp2": emp2}


# @pytest.fixture
# def project(db_session):
#     return service.create_project(
#         db_session,
#         schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
#                                billing_rate=100, cost_rate=50),
#     )


# def test_org_dashboard_blocked_for_plain_employee(client, employees, project):
#     res = client.get(
#         "/utilization/dashboard/org?start_date=2026-01-01&end_date=2026-01-31",
#         headers={"X-Employee-Id": "E1"},
#     )
#     assert res.status_code == 403


# def test_org_dashboard_allowed_for_admin(client, employees, project):
#     res = client.get(
#         "/utilization/dashboard/org?start_date=2026-01-01&end_date=2026-01-31",
#         headers={"X-Employee-Id": "ADM1"},
#     )
#     assert res.status_code == 200


# def test_org_dashboard_without_header_is_rejected(client, employees, project):
#     res = client.get("/utilization/dashboard/org?start_date=2026-01-01&end_date=2026-01-31")
#     assert res.status_code == 401


# def test_project_margin_blocked_for_plain_employee(client, employees, project):
#     res = client.get("/utilization/projects/P1/margin", headers={"X-Employee-Id": "E1"})
#     assert res.status_code == 403


# def test_project_margin_allowed_for_admin(client, employees, project):
#     res = client.get("/utilization/projects/P1/margin", headers={"X-Employee-Id": "ADM1"})
#     assert res.status_code == 200


# def test_personal_dashboard_blocked_for_other_employee(client, employees, project):
#     """E1 cannot view E2's personal utilization dashboard."""
#     res = client.get(
#         "/utilization/dashboard/employee/E2?start_date=2026-01-01&end_date=2026-01-31",
#         headers={"X-Employee-Id": "E1"},
#     )
#     assert res.status_code == 403


# def test_personal_dashboard_allowed_for_self(client, employees, project):
#     res = client.get(
#         "/utilization/dashboard/employee/E1?start_date=2026-01-01&end_date=2026-01-31",
#         headers={"X-Employee-Id": "E1"},
#     )
#     assert res.status_code == 200


# def test_personal_dashboard_allowed_for_admin_viewing_others(client, employees, project):
#     res = client.get(
#         "/utilization/dashboard/employee/E2?start_date=2026-01-01&end_date=2026-01-31",
#         headers={"X-Employee-Id": "ADM1"},
#     )
#     assert res.status_code == 200


# def test_time_entry_ignores_spoofed_employee_id_for_plain_employee(client, employees, project):
#     """E1 is signed in but tries to log hours claiming to be E2 - should be
#     forced back to E1, not accepted as E2."""
#     res = client.post(
#         "/utilization/time-entries",
#         headers={"X-Employee-Id": "E1"},
#         json={
#             "entry_id": "TE-SPOOF-1",
#             "employee_id": "E2",
#             "project_id": "P1",
#             "date": "2026-01-05",
#             "hours": 5,
#             "billable_flag": True,
#         },
#     )
#     assert res.status_code == 200
#     assert res.json()["employee_id"] == "E1"


# def test_time_entry_allows_admin_to_log_on_behalf_of_others(client, employees, project):
#     """Admin/Leadership has a legitimate 'log hours for an employee'
#     feature - their stated employee_id should be respected, not overridden."""
#     res = client.post(
#         "/utilization/time-entries",
#         headers={"X-Employee-Id": "ADM1"},
#         json={
#             "entry_id": "TE-ADMIN-1",
#             "employee_id": "E2",
#             "project_id": "P1",
#             "date": "2026-01-05",
#             "hours": 5,
#             "billable_flag": True,
#         },
#     )
#     assert res.status_code == 200
#     assert res.json()["employee_id"] == "E2"



from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.modules.directory.models import Employee
from app.modules.consultant_utilization import schemas, service


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    def _get_db_override():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_db_override
    yield session
    session.close()
    app.dependency_overrides.clear()


@pytest.fixture
def client(db_session):
    return TestClient(app)


@pytest.fixture
def employees(db_session):
    admin = Employee(employee_id="ADM1", name="Admin One", access_tier="Admin/Leadership")
    hr = Employee(employee_id="HR1", name="HR One", access_tier="HR-Restricted")
    emp1 = Employee(employee_id="E1", name="Employee One", access_tier="Employee")
    emp2 = Employee(employee_id="E2", name="Employee Two", access_tier="Employee")
    db_session.add_all([admin, hr, emp1, emp2])
    db_session.commit()
    return {"admin": admin, "hr": hr, "emp1": emp1, "emp2": emp2}


@pytest.fixture
def project(db_session):
    return service.create_project(
        db_session,
        schemas.ProjectCreate(project_id="P1", name="Client A", project_type="real project",
                               billing_rate=100, cost_rate=50),
    )


def test_org_dashboard_blocked_for_plain_employee(client, employees, project):
    res = client.get(
        "/utilization/dashboard/org?start_date=2026-01-01&end_date=2026-01-31",
        headers={"X-Employee-Id": "E1"},
    )
    assert res.status_code == 403


def test_org_dashboard_allowed_for_admin(client, employees, project):
    res = client.get(
        "/utilization/dashboard/org?start_date=2026-01-01&end_date=2026-01-31",
        headers={"X-Employee-Id": "ADM1"},
    )
    assert res.status_code == 200


def test_org_dashboard_without_header_is_rejected(client, employees, project):
    res = client.get("/utilization/dashboard/org?start_date=2026-01-01&end_date=2026-01-31")
    assert res.status_code == 401


def test_project_margin_blocked_for_plain_employee(client, employees, project):
    res = client.get("/utilization/projects/P1/margin", headers={"X-Employee-Id": "E1"})
    assert res.status_code == 403


def test_project_margin_allowed_for_admin(client, employees, project):
    res = client.get("/utilization/projects/P1/margin", headers={"X-Employee-Id": "ADM1"})
    assert res.status_code == 200


def test_personal_dashboard_blocked_for_other_employee(client, employees, project):
    """E1 cannot view E2's personal utilization dashboard."""
    res = client.get(
        "/utilization/dashboard/employee/E2?start_date=2026-01-01&end_date=2026-01-31",
        headers={"X-Employee-Id": "E1"},
    )
    assert res.status_code == 403


def test_personal_dashboard_allowed_for_self(client, employees, project):
    res = client.get(
        "/utilization/dashboard/employee/E1?start_date=2026-01-01&end_date=2026-01-31",
        headers={"X-Employee-Id": "E1"},
    )
    assert res.status_code == 200


def test_personal_dashboard_allowed_for_admin_viewing_others(client, employees, project):
    res = client.get(
        "/utilization/dashboard/employee/E2?start_date=2026-01-01&end_date=2026-01-31",
        headers={"X-Employee-Id": "ADM1"},
    )
    assert res.status_code == 200


def test_time_entry_ignores_spoofed_employee_id_for_plain_employee(client, employees, project):
    res = client.post(
        "/utilization/time-entries",
        headers={"X-Employee-Id": "E1"},
        json={
            "entry_id": "TE-SPOOF-1",
            "employee_id": "E2",
            "project_id": "P1",
            "date": "2026-01-05",
            "hours": 5,
            "billable_flag": True,
        },
    )
    assert res.status_code == 200
    assert res.json()["employee_id"] == "E1"


def test_time_entry_allows_admin_to_log_on_behalf_of_others(client, employees, project):
    res = client.post(
        "/utilization/time-entries",
        headers={"X-Employee-Id": "ADM1"},
        json={
            "entry_id": "TE-ADMIN-1",
            "employee_id": "E2",
            "project_id": "P1",
            "date": "2026-01-05",
            "hours": 5,
            "billable_flag": True,
        },
    )
    assert res.status_code == 200
    assert res.json()["employee_id"] == "E2"


def test_time_entry_with_overtime_saves_immediately_as_pending(client, employees, project):
    res = client.post(
        "/utilization/time-entries",
        headers={"X-Employee-Id": "E1"},
        json={
            "entry_id": "TE-OT-1",
            "employee_id": "E1",
            "project_id": "P1",
            "date": "2026-01-05",
            "hours": 10,
            "billable_flag": True,
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["normal_hours"] == 8
    assert body["overtime_hours"] == 2
    assert body["ot_status"] == "Pending"


def test_pending_ot_list_blocked_for_plain_employee(client, employees, project):
    res = client.get("/utilization/time-entries/pending-ot", headers={"X-Employee-Id": "E1"})
    assert res.status_code == 403


def test_pending_ot_list_allowed_for_admin_and_hr(client, employees, project):
    client.post(
        "/utilization/time-entries",
        headers={"X-Employee-Id": "E1"},
        json={
            "entry_id": "TE-OT-2",
            "employee_id": "E1",
            "project_id": "P1",
            "date": "2026-01-05",
            "hours": 10,
            "billable_flag": True,
        },
    )
    res_admin = client.get("/utilization/time-entries/pending-ot", headers={"X-Employee-Id": "ADM1"})
    assert res_admin.status_code == 200
    assert len(res_admin.json()) == 1

    res_hr = client.get("/utilization/time-entries/pending-ot", headers={"X-Employee-Id": "HR1"})
    assert res_hr.status_code == 200
    assert len(res_hr.json()) == 1


def test_approve_ot_blocked_for_plain_employee(client, employees, project):
    client.post(
        "/utilization/time-entries",
        headers={"X-Employee-Id": "E1"},
        json={
            "entry_id": "TE-OT-3",
            "employee_id": "E1",
            "project_id": "P1",
            "date": "2026-01-05",
            "hours": 10,
            "billable_flag": True,
        },
    )
    res = client.post("/utilization/time-entries/TE-OT-3/approve-ot", headers={"X-Employee-Id": "E1"})
    assert res.status_code == 403


def test_approve_ot_allowed_for_admin(client, employees, project):
    client.post(
        "/utilization/time-entries",
        headers={"X-Employee-Id": "E1"},
        json={
            "entry_id": "TE-OT-4",
            "employee_id": "E1",
            "project_id": "P1",
            "date": "2026-01-05",
            "hours": 10,
            "billable_flag": True,
        },
    )
    res = client.post("/utilization/time-entries/TE-OT-4/approve-ot", headers={"X-Employee-Id": "ADM1"})
    assert res.status_code == 200
    body = res.json()
    assert body["ot_status"] == "Approved"
    assert body["ot_decided_by_role"] == "Admin/Leadership"


def test_reject_ot_allowed_for_hr(client, employees, project):
    client.post(
        "/utilization/time-entries",
        headers={"X-Employee-Id": "E1"},
        json={
            "entry_id": "TE-OT-5",
            "employee_id": "E1",
            "project_id": "P1",
            "date": "2026-01-05",
            "hours": 10,
            "billable_flag": True,
        },
    )
    res = client.post("/utilization/time-entries/TE-OT-5/reject-ot", headers={"X-Employee-Id": "HR1"})
    assert res.status_code == 200
    body = res.json()
    assert body["ot_status"] == "Rejected"
    assert body["hours"] == 8
    assert body["overtime_hours"] == 0