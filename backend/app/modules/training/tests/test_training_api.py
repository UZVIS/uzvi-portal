from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.modules.directory.models import Employee
from app.database import Base
from app.database import get_db
from app.modules.training.dependencies import get_current_employee
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


def _default_test_employee():
    """
    Every existing test below was written before RBAC existed and calls
    the API with no auth header at all. Rather than rewrite all of them,
    the main `client` is defaulted to an Admin/Leadership identity so
    they keep exercising the same business logic as before. The
    RBAC-specific tests further down use `raw_client` instead, which has
    no such override and goes through the real X-Employee-Id header
    check in dependencies.py.
    """
    return Employee(
        employee_id="TEST-ADMIN",
        name="Test Admin",
        access_tier="Admin/Leadership",
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


# --------------------------------------------------
# Test Helper
# --------------------------------------------------


def create_test_employee():
    """
    Create an employee required for enrollment API tests.
    """

    db = TestingSessionLocal()

    employee = Employee(
        employee_id="EMP001",
        name="Test Employee",
    )

    db.add(employee)
    db.commit()
    db.close()


# --------------------------------------------------
# Training Program API Tests
# --------------------------------------------------


def test_create_training_program():
    response = client.post(
        "/api/training/programs",
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
        "/api/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    response = client.get("/api/training/programs")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Python Full Stack Development"


def test_duplicate_training_program():
    request_body = {
        "name": "Python Full Stack Development",
    }

    client.post(
        "/api/training/programs",
        json=request_body,
    )

    response = client.post(
        "/api/training/programs",
        json=request_body,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "A training program with this name already exists."
    )


# --------------------------------------------------
# Training Unit API Tests
# --------------------------------------------------


def test_create_training_unit():
    program_response = client.post(
        "/api/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    program_id = program_response.json()["program_id"]

    response = client.post(
        f"/api/training/programs/{program_id}/units",
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
        "/api/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    program_id = program_response.json()["program_id"]

    client.post(
        f"/api/training/programs/{program_id}/units",
        json={
            "name": "Advanced Python",
            "sequence": 2,
        },
    )

    client.post(
        f"/api/training/programs/{program_id}/units",
        json={
            "name": "Python Basics",
            "sequence": 1,
        },
    )

    response = client.get(
        f"/api/training/programs/{program_id}/units"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert data[0]["sequence"] == 1
    assert data[1]["sequence"] == 2


def test_duplicate_unit_sequence():
    program_response = client.post(
        "/api/training/programs",
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
        f"/api/training/programs/{program_id}/units",
        json=request_body,
    )

    response = client.post(
        f"/api/training/programs/{program_id}/units",
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
        "/api/training/programs/99999/units",
        json={
            "name": "Test Unit",
            "sequence": 1,
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Training program not found."
    )


# --------------------------------------------------
# Enrollment API Tests
# --------------------------------------------------


def test_create_enrollment():
    create_test_employee()

    program_response = client.post(
        "/api/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    program_id = program_response.json()["program_id"]

    response = client.post(
        "/api/training/enrollments",
        json={
            "employee_id": "EMP001",
            "program_id": program_id,
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["employee_id"] == "EMP001"
    assert data["program_id"] == program_id
    assert "enrolled_at" in data


def test_list_enrollments():
    create_test_employee()

    program_response = client.post(
        "/api/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    program_id = program_response.json()["program_id"]

    client.post(
        "/api/training/enrollments",
        json={
            "employee_id": "EMP001",
            "program_id": program_id,
        },
    )

    response = client.get("/api/training/enrollments")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["employee_id"] == "EMP001"
    assert data[0]["program_id"] == program_id


def test_enrollment_missing_employee():
    program_response = client.post(
        "/api/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    program_id = program_response.json()["program_id"]

    response = client.post(
        "/api/training/enrollments",
        json={
            "employee_id": "UNKNOWN",
            "program_id": program_id,
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Employee not found."
    )


def test_enrollment_missing_program():
    create_test_employee()

    response = client.post(
        "/api/training/enrollments",
        json={
            "employee_id": "EMP001",
            "program_id": 99999,
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Training program not found."
    )


def test_duplicate_enrollment():
    create_test_employee()

    program_response = client.post(
        "/api/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    program_id = program_response.json()["program_id"]

    request_body = {
        "employee_id": "EMP001",
        "program_id": program_id,
    }

    first_response = client.post(
        "/api/training/enrollments",
        json=request_body,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/api/training/enrollments",
        json=request_body,
    )

    assert second_response.status_code == 400
    assert second_response.json()["detail"] == (
        "Employee is already enrolled in this program."
    )

# --------------------------------------------------
# Unit Completion API Tests
# --------------------------------------------------

def create_test_program_unit_and_enrollment():
    """
    Helper used by completion API tests.
    """

    create_test_employee()

    program_response = client.post(
        "/api/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    program_id = program_response.json()["program_id"]

    unit_response = client.post(
        f"/api/training/programs/{program_id}/units",
        json={
            "name": "Python Basics",
            "sequence": 1,
        },
    )

    unit_id = unit_response.json()["unit_id"]

    enrollment_response = client.post(
        "/api/training/enrollments",
        json={
            "employee_id": "EMP001",
            "program_id": program_id,
        },
    )

    enrollment_id = enrollment_response.json()["enrollment_id"]

    return enrollment_id, unit_id


def test_complete_training_unit():
    enrollment_id, unit_id = create_test_program_unit_and_enrollment()

    response = client.post(
        "/api/training/completions",
        json={
            "enrollment_id": enrollment_id,
            "unit_id": unit_id,
            "score": 95,
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["enrollment_id"] == enrollment_id
    assert data["unit_id"] == unit_id
    assert data["score"] == 95


def test_list_completed_units():
    enrollment_id, unit_id = create_test_program_unit_and_enrollment()

    client.post(
        "/api/training/completions",
        json={
            "enrollment_id": enrollment_id,
            "unit_id": unit_id,
            "score": 90,
        },
    )

    response = client.get("/api/training/completions")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["unit_id"] == unit_id


def test_completion_missing_enrollment():
    response = client.post(
        "/api/training/completions",
        json={
            "enrollment_id": 99999,
            "unit_id": 1,
            "score": 80,
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Enrollment not found."


def test_completion_missing_unit():
    enrollment_id, _ = create_test_program_unit_and_enrollment()

    response = client.post(
        "/api/training/completions",
        json={
            "enrollment_id": enrollment_id,
            "unit_id": 99999,
            "score": 80,
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Training unit not found."


def test_duplicate_completion():
    enrollment_id, unit_id = create_test_program_unit_and_enrollment()

    request_body = {
        "enrollment_id": enrollment_id,
        "unit_id": unit_id,
        "score": 90,
    }

    first_response = client.post(
        "/api/training/completions",
        json=request_body,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/api/training/completions",
        json=request_body,
    )

    assert second_response.status_code == 400
    assert second_response.json()["detail"] == (
        "Unit already completed."
    )


def test_completion_wrong_program():
    create_test_employee()

    first_program = client.post(
        "/api/training/programs",
        json={
            "name": "Program One",
        },
    ).json()

    second_program = client.post(
        "/api/training/programs",
        json={
            "name": "Program Two",
        },
    ).json()

    unit = client.post(
        f"/api/training/programs/{second_program['program_id']}/units",
        json={
            "name": "Unit",
            "sequence": 1,
        },
    ).json()

    enrollment = client.post(
        "/api/training/enrollments",
        json={
            "employee_id": "EMP001",
            "program_id": first_program["program_id"],
        },
    ).json()

    response = client.post(
        "/api/training/completions",
        json={
            "enrollment_id": enrollment["enrollment_id"],
            "unit_id": unit["unit_id"],
            "score": 80,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Training unit does not belong to enrolled program."
    )

    # --------------------------------------------------
# Employee Progress API Tests
# --------------------------------------------------

def create_completed_training():
    """
    Create an employee, program, unit, enrollment,
    and completed unit for progress testing.
    """

    create_test_employee()

    program = client.post(
        "/api/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    ).json()

    unit = client.post(
        f"/api/training/programs/{program['program_id']}/units",
        json={
            "name": "Python Basics",
            "sequence": 1,
        },
    ).json()

    enrollment = client.post(
        "/api/training/enrollments",
        json={
            "employee_id": "EMP001",
            "program_id": program["program_id"],
        },
    ).json()

    client.post(
        "/api/training/completions",
        json={
            "enrollment_id": enrollment["enrollment_id"],
            "unit_id": unit["unit_id"],
            "score": 95,
        },
    )


def test_employee_progress_complete():
    create_completed_training()

    response = client.get(
        "/api/training/progress/EMP001"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["employee_id"] == "EMP001"
    assert data["completed_units"] == 1
    assert data["total_units"] == 1
    assert data["completion_percentage"] == 100.0


def test_employee_progress_not_enrolled():
    response = client.get(
        "/api/training/progress/UNKNOWN"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Employee is not enrolled in any training program."
    )


def test_employee_progress_zero_completion():
    create_test_employee()

    program = client.post(
        "/api/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    ).json()

    client.post(
        f"/api/training/programs/{program['program_id']}/units",
        json={
            "name": "Python Basics",
            "sequence": 1,
        },
    )

    client.post(
        "/api/training/enrollments",
        json={
            "employee_id": "EMP001",
            "program_id": program["program_id"],
        },
    )

    response = client.get(
        "/api/training/progress/EMP001"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["completed_units"] == 0
    assert data["total_units"] == 1
    assert data["completion_percentage"] == 0.0


# --------------------------------------------------
# Cohort Progress / Falling-Behind Flag Tests (FR-LMS-03 / FR-LMS-05)
# --------------------------------------------------


def create_employee(employee_id):
    db = TestingSessionLocal()
    db.add(Employee(employee_id=employee_id, name=f"Employee {employee_id}"))
    db.commit()
    db.close()


def create_program_with_units(unit_count):
    program = client.post(
        "/api/training/programs",
        json={"name": "Python Full Stack Development"},
    ).json()

    for seq in range(1, unit_count + 1):
        client.post(
            f"/api/training/programs/{program['program_id']}/units",
            json={"name": f"Unit {seq}", "sequence": seq},
        )

    units = client.get(
        f"/api/training/programs/{program['program_id']}/units"
    ).json()

    return program, units


def enroll(employee_id, program_id):
    return client.post(
        "/api/training/enrollments",
        json={"employee_id": employee_id, "program_id": program_id},
    ).json()


def complete_unit(enrollment_id, unit_id, score=None):
    client.post(
        "/api/training/completions",
        json={
            "enrollment_id": enrollment_id,
            "unit_id": unit_id,
            "score": score,
        },
    )


def test_cohort_progress_missing_program():
    response = client.get("/api/training/cohort-progress/99999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Training program not found."


def test_cohort_progress_averages_and_completion_count():
    create_employee("EMP001")
    create_employee("EMP002")

    program, units = create_program_with_units(unit_count=2)

    enrollment_1 = enroll("EMP001", program["program_id"])
    enrollment_2 = enroll("EMP002", program["program_id"])

    # EMP001 finishes both units (100%), EMP002 finishes none (0%).
    complete_unit(enrollment_1["enrollment_id"], units[0]["unit_id"])
    complete_unit(enrollment_1["enrollment_id"], units[1]["unit_id"])

    response = client.get(
        f"/api/training/cohort-progress/{program['program_id']}"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total_enrollments"] == 2
    assert data["completed_enrollments"] == 1
    assert data["average_completion_percentage"] == 50.0


def test_cohort_progress_flags_employee_falling_behind():
    create_employee("EMP001")
    create_employee("EMP002")
    create_employee("EMP003")

    program, units = create_program_with_units(unit_count=4)

    enrollment_1 = enroll("EMP001", program["program_id"])
    enrollment_2 = enroll("EMP002", program["program_id"])
    enrollment_3 = enroll("EMP003", program["program_id"])

    # EMP001 and EMP002 are on pace (100% and 75%); EMP003 has done nothing (0%),
    # which trails the cohort average by more than the 20-point threshold.
    complete_unit(enrollment_1["enrollment_id"], units[0]["unit_id"])
    complete_unit(enrollment_1["enrollment_id"], units[1]["unit_id"])
    complete_unit(enrollment_1["enrollment_id"], units[2]["unit_id"])
    complete_unit(enrollment_1["enrollment_id"], units[3]["unit_id"])

    complete_unit(enrollment_2["enrollment_id"], units[0]["unit_id"])
    complete_unit(enrollment_2["enrollment_id"], units[1]["unit_id"])
    complete_unit(enrollment_2["enrollment_id"], units[2]["unit_id"])

    response = client.get(
        f"/api/training/cohort-progress/{program['program_id']}"
    )

    assert response.status_code == 200

    data = response.json()
    lagging_ids = [entry["employee_id"] for entry in data["lagging_employees"]]

    assert lagging_ids == ["EMP003"]
    assert data["lagging_employees"][0]["completion_percentage"] == 0.0


def test_cohort_progress_single_enrollment_has_no_lagging_flag():
    create_employee("EMP001")

    program, units = create_program_with_units(unit_count=2)
    enroll("EMP001", program["program_id"])

    response = client.get(
        f"/api/training/cohort-progress/{program['program_id']}"
    )

    assert response.status_code == 200
    # A single enrollee has no cohort average to fall behind, so nobody
    # should ever be flagged.
    assert response.json()["lagging_employees"] == []


# --------------------------------------------------
# RBAC Tests (NFR-SEC-01/02/03, FR-LMS-01, FR-LMS-05)
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


def test_create_program_requires_auth_header():
    response = raw_client.post(
        "/api/training/programs", json={"name": "Unauthenticated Program"}
    )

    assert response.status_code == 401


def test_create_program_rejects_unknown_employee_id():
    response = raw_client.post(
        "/api/training/programs",
        json={"name": "Ghost Program"},
        headers=auth_headers("NOT-A-REAL-EMPLOYEE"),
    )

    assert response.status_code == 401


def test_create_program_rejects_non_admin():
    seed_employee("EMP001", access_tier="Employee")

    response = raw_client.post(
        "/api/training/programs",
        json={"name": "Employee-Made Program"},
        headers=auth_headers("EMP001"),
    )

    assert response.status_code == 403


def test_create_program_allows_admin():
    seed_employee("ADMIN1", access_tier="Admin/Leadership")

    response = raw_client.post(
        "/api/training/programs",
        json={"name": "Admin-Made Program"},
        headers=auth_headers("ADMIN1"),
    )

    assert response.status_code == 201


def test_cohort_progress_rejects_plain_employee():
    seed_employee("EMP001", access_tier="Employee")
    seed_employee("ADMIN1", access_tier="Admin/Leadership")

    program = raw_client.post(
        "/api/training/programs",
        json={"name": "RBAC Cohort Program"},
        headers=auth_headers("ADMIN1"),
    ).json()

    response = raw_client.get(
        f"/api/training/cohort-progress/{program['program_id']}",
        headers=auth_headers("EMP001"),
    )

    assert response.status_code == 403


def test_cohort_progress_allows_manager():
    seed_employee("MGR1", access_tier="Manager")
    seed_employee("ADMIN1", access_tier="Admin/Leadership")

    program = raw_client.post(
        "/api/training/programs",
        json={"name": "Manager-Viewable Program"},
        headers=auth_headers("ADMIN1"),
    ).json()

    response = raw_client.get(
        f"/api/training/cohort-progress/{program['program_id']}",
        headers=auth_headers("MGR1"),
    )

    assert response.status_code == 200


def test_employee_can_view_own_progress():
    seed_employee("EMP001", access_tier="Employee")
    seed_employee("ADMIN1", access_tier="Admin/Leadership")

    program = raw_client.post(
        "/api/training/programs",
        json={"name": "Self-View Program"},
        headers=auth_headers("ADMIN1"),
    ).json()

    raw_client.post(
        "/api/training/enrollments",
        json={"employee_id": "EMP001", "program_id": program["program_id"]},
        headers=auth_headers("EMP001"),
    )

    response = raw_client.get(
        "/api/training/progress/EMP001",
        headers=auth_headers("EMP001"),
    )

    assert response.status_code == 200


def test_employee_cannot_view_others_progress():
    seed_employee("EMP001", access_tier="Employee")
    seed_employee("EMP002", access_tier="Employee")
    seed_employee("ADMIN1", access_tier="Admin/Leadership")

    program = raw_client.post(
        "/api/training/programs",
        json={"name": "Privacy Program"},
        headers=auth_headers("ADMIN1"),
    ).json()

    raw_client.post(
        "/api/training/enrollments",
        json={"employee_id": "EMP002", "program_id": program["program_id"]},
        headers=auth_headers("EMP002"),
    )

    response = raw_client.get(
        "/api/training/progress/EMP002",
        headers=auth_headers("EMP001"),
    )

    assert response.status_code == 403


def test_manager_can_view_any_employee_progress():
    seed_employee("EMP002", access_tier="Employee")
    seed_employee("MGR1", access_tier="Manager")
    seed_employee("ADMIN1", access_tier="Admin/Leadership")

    program = raw_client.post(
        "/api/training/programs",
        json={"name": "Manager-Visible Program"},
        headers=auth_headers("ADMIN1"),
    ).json()

    raw_client.post(
        "/api/training/enrollments",
        json={"employee_id": "EMP002", "program_id": program["program_id"]},
        headers=auth_headers("EMP002"),
    )

    response = raw_client.get(
        "/api/training/progress/EMP002",
        headers=auth_headers("MGR1"),
    )

    assert response.status_code == 200