from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.modules.directory.models import Employee
from app.database import Base
from app.database import get_db
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


# --------------------------------------------------
# Training Unit API Tests
# --------------------------------------------------


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


# --------------------------------------------------
# Enrollment API Tests
# --------------------------------------------------


def test_create_enrollment():
    create_test_employee()

    program_response = client.post(
        "/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    program_id = program_response.json()["program_id"]

    response = client.post(
        "/training/enrollments",
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
        "/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    program_id = program_response.json()["program_id"]

    client.post(
        "/training/enrollments",
        json={
            "employee_id": "EMP001",
            "program_id": program_id,
        },
    )

    response = client.get("/training/enrollments")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["employee_id"] == "EMP001"
    assert data[0]["program_id"] == program_id


def test_enrollment_missing_employee():
    program_response = client.post(
        "/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    program_id = program_response.json()["program_id"]

    response = client.post(
        "/training/enrollments",
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
        "/training/enrollments",
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
        "/training/programs",
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
        "/training/enrollments",
        json=request_body,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/training/enrollments",
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
        "/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    )

    program_id = program_response.json()["program_id"]

    unit_response = client.post(
        f"/training/programs/{program_id}/units",
        json={
            "name": "Python Basics",
            "sequence": 1,
        },
    )

    unit_id = unit_response.json()["unit_id"]

    enrollment_response = client.post(
        "/training/enrollments",
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
        "/training/completions",
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
        "/training/completions",
        json={
            "enrollment_id": enrollment_id,
            "unit_id": unit_id,
            "score": 90,
        },
    )

    response = client.get("/training/completions")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["unit_id"] == unit_id


def test_completion_missing_enrollment():
    response = client.post(
        "/training/completions",
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
        "/training/completions",
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
        "/training/completions",
        json=request_body,
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/training/completions",
        json=request_body,
    )

    assert second_response.status_code == 400
    assert second_response.json()["detail"] == (
        "Unit already completed."
    )


def test_completion_wrong_program():
    create_test_employee()

    first_program = client.post(
        "/training/programs",
        json={
            "name": "Program One",
        },
    ).json()

    second_program = client.post(
        "/training/programs",
        json={
            "name": "Program Two",
        },
    ).json()

    unit = client.post(
        f"/training/programs/{second_program['program_id']}/units",
        json={
            "name": "Unit",
            "sequence": 1,
        },
    ).json()

    enrollment = client.post(
        "/training/enrollments",
        json={
            "employee_id": "EMP001",
            "program_id": first_program["program_id"],
        },
    ).json()

    response = client.post(
        "/training/completions",
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
        "/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    ).json()

    unit = client.post(
        f"/training/programs/{program['program_id']}/units",
        json={
            "name": "Python Basics",
            "sequence": 1,
        },
    ).json()

    enrollment = client.post(
        "/training/enrollments",
        json={
            "employee_id": "EMP001",
            "program_id": program["program_id"],
        },
    ).json()

    client.post(
        "/training/completions",
        json={
            "enrollment_id": enrollment["enrollment_id"],
            "unit_id": unit["unit_id"],
            "score": 95,
        },
    )


def test_employee_progress_complete():
    create_completed_training()

    response = client.get(
        "/training/progress/EMP001"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["employee_id"] == "EMP001"
    assert data["completed_units"] == 1
    assert data["total_units"] == 1
    assert data["completion_percentage"] == 100.0


def test_employee_progress_not_enrolled():
    response = client.get(
        "/training/progress/UNKNOWN"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Employee is not enrolled in any training program."
    )


def test_employee_progress_zero_completion():
    create_test_employee()

    program = client.post(
        "/training/programs",
        json={
            "name": "Python Full Stack Development",
        },
    ).json()

    client.post(
        f"/training/programs/{program['program_id']}/units",
        json={
            "name": "Python Basics",
            "sequence": 1,
        },
    )

    client.post(
        "/training/enrollments",
        json={
            "employee_id": "EMP001",
            "program_id": program["program_id"],
        },
    )

    response = client.get(
        "/training/progress/EMP001"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["completed_units"] == 0
    assert data["total_units"] == 1
    assert data["completion_percentage"] == 0.0