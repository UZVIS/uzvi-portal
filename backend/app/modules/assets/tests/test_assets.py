from datetime import date

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.modules.assets.router import router as assets_router
from app.modules.assets.models import Asset, AssetAssignment
from app.modules.directory.models import Employee


# ----------------------------
# Test App / DB Fixture
# ----------------------------
@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine
    )

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app = FastAPI()
    app.include_router(assets_router)
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    Base.metadata.drop_all(bind=engine)


# ----------------------------
# Helpers
# ----------------------------
def make_asset_payload(
    asset_id="AST-001",
    tag="TAG-001",
    asset_type="Laptop",
    purchase_date="2024-01-01",
    status="In Stock",
):
    return {
        "asset_id": asset_id,
        "tag": tag,
        "asset_type": asset_type,
        "purchase_date": purchase_date,
        "status": status,
    }


def create_asset_via_api(client, **kwargs):
    payload = make_asset_payload(**kwargs)
    response = client.post("/api/v1/assets/", json=payload)
    assert response.status_code == 201
    return response.json()


# =====================================================
# Create Asset
# =====================================================
def test_create_asset_success(client):
    response = client.post("/api/v1/assets/", json=make_asset_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["asset_id"] == "AST-001"
    assert body["tag"] == "TAG-001"
    assert body["status"] == "In Stock"


def test_create_asset_duplicate_asset_id(client):
    create_asset_via_api(client)

    response = client.post(
        "/api/v1/assets/",
        json=make_asset_payload(tag="TAG-002"),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Asset with this ID already exists."


def test_create_asset_duplicate_tag(client):
    create_asset_via_api(client)

    response = client.post(
        "/api/v1/assets/",
        json=make_asset_payload(asset_id="AST-002"),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Asset tag already exists."


# =====================================================
# Get In-Stock / Assigned Assets
# =====================================================
def test_get_in_stock_assets(client):
    create_asset_via_api(client, asset_id="AST-001", tag="TAG-001", status="In Stock")
    create_asset_via_api(client, asset_id="AST-002", tag="TAG-002", status="Assigned")

    response = client.get("/api/v1/assets/in-stock")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["asset_id"] == "AST-001"


def test_get_assigned_assets(client):
    create_asset_via_api(client, asset_id="AST-001", tag="TAG-001", status="In Stock")
    create_asset_via_api(client, asset_id="AST-002", tag="TAG-002", status="Assigned")

    response = client.get("/api/v1/assets/assigned")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["asset_id"] == "AST-002"


# =====================================================
# Get All Assets
# =====================================================
def test_get_all_assets_without_assignment(client):
    create_asset_via_api(client)

    response = client.get("/api/v1/assets/")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["asset_id"] == "AST-001"
    assert body[0]["assignment_id"] is None
    assert body[0]["employee_id"] is None
    assert body[0]["employee_name"] is None


def test_get_all_assets_with_active_assignment(client):
    create_asset_via_api(client, status="In Stock")

    # Insert an employee directly (no employee endpoints on this router)
    engine_session = client.app.dependency_overrides[get_db]
    db = next(engine_session())
    db.add(Employee(employee_id="EMP-001", name="John Doe", employment_status="active"))
    db.commit()
    db.close()

    assign_response = client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-001",
            "asset_id": "AST-001",
            "employee_id": "EMP-001",
            "assigned_date": "2024-02-01",
        },
    )
    assert assign_response.status_code == 201

    response = client.get("/api/v1/assets/")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["assignment_id"] == "ASG-001"
    assert body[0]["employee_id"] == "EMP-001"
    assert body[0]["employee_name"] == "John Doe"


# =====================================================
# Assignments (Admin)
# =====================================================
def test_get_all_assignments(client):
    create_asset_via_api(client, status="In Stock")

    db_gen = client.app.dependency_overrides[get_db]
    db = next(db_gen())
    db.add(Employee(employee_id="EMP-001", name="John Doe", employment_status="active"))
    db.commit()
    db.close()

    client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-001",
            "asset_id": "AST-001",
            "employee_id": "EMP-001",
            "assigned_date": "2024-02-01",
        },
    )

    response = client.get("/api/v1/assets/assignments")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["assignment_id"] == "ASG-001"


def test_get_assignment_by_id_success(client):
    create_asset_via_api(client, status="In Stock")

    db_gen = client.app.dependency_overrides[get_db]
    db = next(db_gen())
    db.add(Employee(employee_id="EMP-001", name="John Doe", employment_status="active"))
    db.commit()
    db.close()

    client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-001",
            "asset_id": "AST-001",
            "employee_id": "EMP-001",
            "assigned_date": "2024-02-01",
        },
    )

    response = client.get("/api/v1/assets/assignments/ASG-001")

    assert response.status_code == 200
    assert response.json()["assignment_id"] == "ASG-001"


def test_get_assignment_by_id_not_found(client):
    response = client.get("/api/v1/assets/assignments/MISSING")

    assert response.status_code == 404
    assert response.json()["detail"] == "Assignment not found."


# =====================================================
# Inventory Summary / By Type
# =====================================================
def test_get_inventory_summary(client):
    create_asset_via_api(client, asset_id="AST-001", tag="TAG-001", status="In Stock")
    create_asset_via_api(client, asset_id="AST-002", tag="TAG-002", status="Assigned")
    create_asset_via_api(client, asset_id="AST-003", tag="TAG-003", status="Under Repair")
    create_asset_via_api(client, asset_id="AST-004", tag="TAG-004", status="Retired")

    response = client.get("/api/v1/assets/summary")

    assert response.status_code == 200
    body = response.json()
    assert body["total_assets"] == 4
    assert body["in_stock_assets"] == 1
    assert body["assigned_assets"] == 1
    assert body["under_repair_assets"] == 1
    assert body["retired_assets"] == 1


def test_get_inventory_by_type(client):
    create_asset_via_api(client, asset_id="AST-001", tag="TAG-001", asset_type="Laptop")
    create_asset_via_api(client, asset_id="AST-002", tag="TAG-002", asset_type="Laptop")
    create_asset_via_api(client, asset_id="AST-003", tag="TAG-003", asset_type="Monitor")

    response = client.get("/api/v1/assets/summary/type")

    assert response.status_code == 200
    assert response.json() == {"Laptop": 2, "Monitor": 1}


# =====================================================
# Pending Returns
# =====================================================
def test_get_pending_returns_only_exited_employees(client):
    create_asset_via_api(client, asset_id="AST-001", tag="TAG-001", status="In Stock")
    create_asset_via_api(client, asset_id="AST-002", tag="TAG-002", status="In Stock")

    db_gen = client.app.dependency_overrides[get_db]
    db = next(db_gen())
    db.add(Employee(employee_id="EMP-001", name="Exited Guy", employment_status="Exited"))
    db.add(Employee(employee_id="EMP-002", name="Active Guy", employment_status="active"))
    db.commit()
    db.close()

    client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-001",
            "asset_id": "AST-001",
            "employee_id": "EMP-001",
            "assigned_date": "2024-02-01",
        },
    )
    client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-002",
            "asset_id": "AST-002",
            "employee_id": "EMP-002",
            "assigned_date": "2024-02-01",
        },
    )

    response = client.get("/api/v1/assets/pending-returns")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["assignment_id"] == "ASG-001"
    assert body[0]["employee_id"] == "EMP-001"


# =====================================================
# Get Asset By ID
# =====================================================
def test_get_asset_by_id_success(client):
    create_asset_via_api(client)

    response = client.get("/api/v1/assets/AST-001")

    assert response.status_code == 200
    assert response.json()["asset_id"] == "AST-001"


def test_get_asset_by_id_not_found(client):
    response = client.get("/api/v1/assets/MISSING")

    assert response.status_code == 404
    assert response.json()["detail"] == "Asset not found."


# =====================================================
# Update Asset
# =====================================================
def test_update_asset_success(client):
    create_asset_via_api(client, asset_type="Laptop")

    response = client.put(
        "/api/v1/assets/AST-001",
        json=make_asset_payload(
            tag="TAG-999",
            asset_type="Monitor",
            purchase_date="2025-01-01",
            status="Under Repair",
        ),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["tag"] == "TAG-999"
    assert body["asset_type"] == "Monitor"
    assert body["status"] == "Under Repair"


def test_update_asset_not_found(client):
    response = client.put(
        "/api/v1/assets/MISSING",
        json=make_asset_payload(asset_id="MISSING"),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Asset not found."


def test_update_asset_duplicate_tag(client):
    create_asset_via_api(client, asset_id="AST-001", tag="TAG-001")
    create_asset_via_api(client, asset_id="AST-002", tag="TAG-002")

    response = client.put(
        "/api/v1/assets/AST-002",
        json=make_asset_payload(asset_id="AST-002", tag="TAG-001"),
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Asset tag already exists."


# =====================================================
# Delete Asset
# =====================================================
def test_delete_asset_success(client):
    create_asset_via_api(client, status="In Stock")

    response = client.delete("/api/v1/assets/AST-001")

    assert response.status_code == 200
    assert response.json() == {"message": "Asset deleted successfully"}

    follow_up = client.get("/api/v1/assets/AST-001")
    assert follow_up.status_code == 404


def test_delete_asset_not_found(client):
    response = client.delete("/api/v1/assets/MISSING")

    assert response.status_code == 404
    assert response.json()["detail"] == "Asset not found."


def test_delete_asset_assigned_blocked(client):
    create_asset_via_api(client, status="Assigned")

    response = client.delete("/api/v1/assets/AST-001")

    assert response.status_code == 400
    assert response.json()["detail"] == "Assigned assets cannot be deleted. Return the asset first."


# =====================================================
# Assign Asset
# =====================================================
def test_assign_asset_success(client):
    create_asset_via_api(client, status="In Stock")

    db_gen = client.app.dependency_overrides[get_db]
    db = next(db_gen())
    db.add(Employee(employee_id="EMP-001", name="John Doe", employment_status="active"))
    db.commit()
    db.close()

    response = client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-001",
            "asset_id": "AST-001",
            "employee_id": "EMP-001",
            "assigned_date": "2024-02-01",
        },
    )

    assert response.status_code == 201
    assert response.json()["assignment_id"] == "ASG-001"

    asset_response = client.get("/api/v1/assets/AST-001")
    assert asset_response.json()["status"] == "Assigned"


def test_assign_asset_duplicate_assignment_id(client):
    create_asset_via_api(client, asset_id="AST-001", tag="TAG-001", status="In Stock")
    create_asset_via_api(client, asset_id="AST-002", tag="TAG-002", status="In Stock")

    db_gen = client.app.dependency_overrides[get_db]
    db = next(db_gen())
    db.add(Employee(employee_id="EMP-001", name="John Doe", employment_status="active"))
    db.commit()
    db.close()

    client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-001",
            "asset_id": "AST-001",
            "employee_id": "EMP-001",
            "assigned_date": "2024-02-01",
        },
    )

    response = client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-001",
            "asset_id": "AST-002",
            "employee_id": "EMP-001",
            "assigned_date": "2024-02-01",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Assignment ID already exists."


def test_assign_asset_asset_not_found(client):
    response = client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-001",
            "asset_id": "MISSING",
            "employee_id": "EMP-001",
            "assigned_date": "2024-02-01",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Asset not found."


def test_assign_asset_employee_not_found(client):
    create_asset_via_api(client, status="In Stock")

    response = client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-001",
            "asset_id": "AST-001",
            "employee_id": "MISSING",
            "assigned_date": "2024-02-01",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Employee not found."


def test_assign_asset_not_in_stock(client):
    create_asset_via_api(client, status="Under Repair")

    db_gen = client.app.dependency_overrides[get_db]
    db = next(db_gen())
    db.add(Employee(employee_id="EMP-001", name="John Doe", employment_status="active"))
    db.commit()
    db.close()

    response = client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-001",
            "asset_id": "AST-001",
            "employee_id": "EMP-001",
            "assigned_date": "2024-02-01",
        },
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Asset cannot be assigned because its status is 'Under Repair'."
    )


# =====================================================
# Return Asset
# =====================================================
def test_return_asset_success(client):
    create_asset_via_api(client, status="In Stock")

    db_gen = client.app.dependency_overrides[get_db]
    db = next(db_gen())
    db.add(Employee(employee_id="EMP-001", name="John Doe", employment_status="active"))
    db.commit()
    db.close()

    client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-001",
            "asset_id": "AST-001",
            "employee_id": "EMP-001",
            "assigned_date": "2024-02-01",
        },
    )

    response = client.put(
        "/api/v1/assets/return/ASG-001",
        json={"returned_date": "2024-06-01", "remarks": "Good condition"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["returned_date"] == "2024-06-01"
    assert body["remarks"] == "Good condition"

    asset_response = client.get("/api/v1/assets/AST-001")
    assert asset_response.json()["status"] == "In Stock"


def test_return_asset_not_found(client):
    response = client.put(
        "/api/v1/assets/return/MISSING",
        json={"returned_date": "2024-06-01"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Assignment not found."


def test_return_asset_already_returned(client):
    create_asset_via_api(client, status="In Stock")

    db_gen = client.app.dependency_overrides[get_db]
    db = next(db_gen())
    db.add(Employee(employee_id="EMP-001", name="John Doe", employment_status="active"))
    db.commit()
    db.close()

    client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-001",
            "asset_id": "AST-001",
            "employee_id": "EMP-001",
            "assigned_date": "2024-02-01",
        },
    )
    client.put(
        "/api/v1/assets/return/ASG-001",
        json={"returned_date": "2024-06-01"},
    )

    response = client.put(
        "/api/v1/assets/return/ASG-001",
        json={"returned_date": "2024-07-01"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Asset already returned."


# =====================================================
# Asset History
# =====================================================
def test_get_asset_history_success(client):
    create_asset_via_api(client, status="In Stock")

    db_gen = client.app.dependency_overrides[get_db]
    db = next(db_gen())
    db.add(Employee(employee_id="EMP-001", name="John Doe", employment_status="active"))
    db.commit()
    db.close()

    client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-001",
            "asset_id": "AST-001",
            "employee_id": "EMP-001",
            "assigned_date": "2024-01-01",
        },
    )
    client.put(
        "/api/v1/assets/return/ASG-001",
        json={"returned_date": "2024-03-01"},
    )
    client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-002",
            "asset_id": "AST-001",
            "employee_id": "EMP-001",
            "assigned_date": "2024-04-01",
        },
    )

    response = client.get("/api/v1/assets/AST-001/history")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    # ordered by assigned_date desc
    assert body[0]["assignment_id"] == "ASG-002"
    assert body[0]["employee_name"] == "John Doe"
    assert body[1]["assignment_id"] == "ASG-001"


def test_get_asset_history_asset_not_found(client):
    response = client.get("/api/v1/assets/MISSING/history")

    assert response.status_code == 404
    assert response.json()["detail"] == "Asset not found."


# =====================================================
# Employee Assets
# =====================================================
def test_get_employee_assets_success(client):
    create_asset_via_api(client, asset_id="AST-001", tag="TAG-001", status="In Stock")
    create_asset_via_api(client, asset_id="AST-002", tag="TAG-002", status="In Stock")

    db_gen = client.app.dependency_overrides[get_db]
    db = next(db_gen())
    db.add(Employee(employee_id="EMP-001", name="John Doe", employment_status="active"))
    db.commit()
    db.close()

    client.post(
        "/api/v1/assets/assign",
        json={
            "assignment_id": "ASG-001",
            "asset_id": "AST-001",
            "employee_id": "EMP-001",
            "assigned_date": "2024-02-01",
        },
    )

    response = client.get("/api/v1/assets/employee/EMP-001")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["asset_id"] == "AST-001"


def test_get_employee_assets_employee_not_found(client):
    response = client.get("/api/v1/assets/employee/MISSING")

    assert response.status_code == 404
    assert response.json()["detail"] == "Employee not found."
