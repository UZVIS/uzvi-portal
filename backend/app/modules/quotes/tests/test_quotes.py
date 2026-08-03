import os
import tempfile
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

# Import ALL models so SQLAlchemy registers relationships
from app.modules.directory.models import Employee, Team
from app.modules.quotes.models import (
    Opportunity,
    QuoteScenario,
    StandardCostLibrary,
    CostLineItem,
)

# -------------------------------
# Test Database
# -------------------------------

db_fd, db_path = tempfile.mkstemp()

SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)

    yield

    Base.metadata.drop_all(bind=engine)
    engine.dispose()   
    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def db():
    database = TestingSessionLocal()
    yield database
    database.close()

@pytest.fixture()
def employee(db):

    team = db.query(Team).filter(
        Team.team_id == "TEAM001"
    ).first()

    if not team:
        team = Team(
            team_id="TEAM001",
            name="Engineering",
        )
        db.add(team)
        db.commit()

    employee = db.query(Employee).filter(
        Employee.employee_id == "EMP001"
    ).first()

    if not employee:
        employee = Employee(
            employee_id="EMP001",
            name="Revathi",
            designation="Software Developer",
            team_id="TEAM001",
            join_date=date.today(),
            employment_status="active",
            access_tier="Employee",
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)

    return employee


@pytest.fixture()
def opportunity(client):

    response = client.post(
        "/api/v1/quotes/opportunities",
        json={
            "name": "SGSW Portal",
            "client": "Government",
        },
    )

    assert response.status_code == 201

    return response.json()


@pytest.fixture()
def library_item(client):

    response = client.post(
        "/api/v1/quotes/library",
        json={
            "name": "Developer",
            "unit_cost": 500.0,
            "category": "Resources",
            "cost_component": "vendor",
        },
    )

    assert response.status_code == 201

    return response.json()


@pytest.fixture()
def scenario(client, employee, opportunity):

    response = client.post(
        "/api/v1/quotes/scenarios",
        json={
            "opportunity_id": opportunity["opportunity_id"],
            "created_by": employee.employee_id,
            "name": "Scenario A",
            "output_type": "quote",
            "target_margin": 0.30,
        },
    )

    assert response.status_code == 201

    return response.json()


# Opportunity, Library & Scenario Tests
# ============================================================
# Opportunity Tests
# ============================================================

def test_create_opportunity(client):

    response = client.post(
        "/api/v1/quotes/opportunities",
        json={
            "name": "Employee Portal",
            "client": "UZVI",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Employee Portal"
    assert data["client"] == "UZVI"
    assert "opportunity_id" in data


def test_list_opportunities(client, opportunity):

    response = client.get("/api/v1/quotes/opportunities")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_opportunity(client, opportunity):

    response = client.get(
        f"/api/v1/quotes/opportunities/{opportunity['opportunity_id']}"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["opportunity_id"] == opportunity["opportunity_id"]


def test_get_invalid_opportunity(client):

    response = client.get(
        "/api/v1/quotes/opportunities/INVALID_ID"
    )

    assert response.status_code == 404

    assert response.json()["detail"] == "Opportunity not found"

# # Standard Cost Library Tests
# # ============================================================
# # Library Tests
# # ============================================================

def test_create_library_item(client):

    response = client.post(
        "/api/v1/quotes/library",
        json={
            "name": "AWS Server",
            "unit_cost": 1200,
            "category": "Infrastructure",
            "cost_component": "vendor",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "AWS Server"
    assert data["unit_cost"] == 1200


def test_list_library_items(client, library_item):

    response = client.get("/api/v1/quotes/library")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1


# # ============================================================
# # Scenario Tests
# # ============================================================

def test_create_scenario(client, employee, opportunity):

    response = client.post(
        "/api/v1/quotes/scenarios",
        json={
            "opportunity_id": opportunity["opportunity_id"],
            "created_by": employee.employee_id,
            "name": "Production Estimate",
            "output_type": "quote",
            "target_margin": 0.25,
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Production Estimate"
    assert data["output_type"] == "quote"
    assert data["target_margin"] == 0.25


def test_create_scenario_invalid_opportunity(client, employee):

    response = client.post(
        "/api/v1/quotes/scenarios",
        json={
            "opportunity_id": "INVALID",
            "created_by": employee.employee_id,
            "name": "Scenario",
            "output_type": "quote",
            "target_margin": 0.30,
        },
    )

    assert response.status_code == 422

    assert response.json()["detail"] == "Unknown opportunity_id"


def test_get_scenario(client, scenario):

    response = client.get(
        f"/api/v1/quotes/scenarios/{scenario['scenario_id']}"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["scenario_id"] == scenario["scenario_id"]

def test_list_scenarios(client, opportunity, scenario):

    response = client.get(
        f"/api/v1/quotes/opportunities/{opportunity['opportunity_id']}/scenarios"
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1

def test_update_scenario(client, scenario):

    response = client.put(
        f"/api/v1/quotes/scenarios/{scenario['scenario_id']}",
        json={
            "name": "Updated Scenario",
            "output_type": "tender",
            "target_margin": 0.40,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Updated Scenario"
    assert data["output_type"] == "tender"
    assert data["target_margin"] == 0.40


def test_get_invalid_scenario(client):

    response = client.get(
        "/api/v1/quotes/scenarios/INVALID"
    )

    assert response.status_code == 404

    assert response.json()["detail"] == "Scenario not found"


# add line item
@pytest.fixture()
def employee(db):

    team = db.query(Team).filter(
        Team.team_id == "TEAM001"
    ).first()

    if not team:
        team = Team(
            team_id="TEAM001",
            name="Engineering",
        )
        db.add(team)
        db.commit()

    employee = db.query(Employee).filter(
        Employee.employee_id == "EMP001"
    ).first()

    if not employee:
        employee = Employee(
            employee_id="EMP001",
            name="Revathi",
            designation="Software Developer",
            team_id="TEAM001",
            join_date=date.today(),
            employment_status="active",
            access_tier="Employee",
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)

    return employee

@pytest.fixture()
def line_item(client, scenario, library_item):

    response = client.post(
        f"/api/v1/quotes/scenarios/{scenario['scenario_id']}/line-items",
        json={
            "description": "Developer",
            "vendor_cost": 0,
            "internal_cost": 0,
            "quantity": 5,
            "cohort": "Batch A",
            "library_item_id": library_item["item_id"],
        },
    )

    assert response.status_code == 201

    return response.json()

def test_update_line_item(client, line_item):

    response = client.put(
        f"/api/v1/quotes/line-items/{line_item['line_item_id']}",
        json={
            "description": "Senior Developer",
            "vendor_cost": 800,
            "internal_cost": 200,
            "quantity": 10,
            "cohort": "Batch B",
            "library_item_id": None,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["description"] == "Senior Developer"
    assert data["quantity"] == 10

def test_delete_line_item(client, line_item):

    response = client.delete(
        f"/api/v1/quotes/line-items/{line_item['line_item_id']}"
    )

    assert response.status_code == 204

def test_update_invalid_line_item(client):

    response = client.put(
        "/api/v1/quotes/line-items/INVALID",
        json={
            "description": "Developer",
            "vendor_cost": 100,
            "internal_cost": 50,
            "quantity": 2,
            "cohort": "Batch A",
            "library_item_id": None,
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Line item not found"


def test_delete_invalid_line_item(client):

    response = client.delete(
        "/api/v1/quotes/line-items/INVALID"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Line item not found"


def test_quote_view(client, line_item, scenario):

    response = client.get(
        f"/api/v1/quotes/scenarios/{scenario['scenario_id']}/quote-view"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["scenario_id"] == scenario["scenario_id"]
    assert "selling_price" in data
    assert "total_cost" in data
    assert len(data["lines"]) == 1

def test_tender_view(client, line_item, scenario):

    response = client.get(
        f"/api/v1/quotes/scenarios/{scenario['scenario_id']}/tender-view"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["scenario_id"] == scenario["scenario_id"]
    assert "selling_price" in data
    assert "total_vendor_cost" in data
    assert "total_internal_cost" in data
    assert len(data["lines"]) == 1

def test_add_line_item_invalid_scenario(client):

    response = client.post(
        "/api/v1/quotes/scenarios/INVALID/line-items",
        json={
            "description": "Developer",
            "vendor_cost": 100,
            "internal_cost": 50,
            "quantity": 2,
            "cohort": "Batch A",
            "library_item_id": None,
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Scenario not found"

def test_add_line_item_invalid_library(client, scenario):

    response = client.post(
        f"/api/v1/quotes/scenarios/{scenario['scenario_id']}/line-items",
        json={
            "description": "Developer",
            "vendor_cost": 100,
            "internal_cost": 50,
            "quantity": 1,
            "cohort": "Batch A",
            "library_item_id": "INVALID",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Library item not found"
def test_quote_view_invalid_scenario(client):

    response = client.get(
        "/api/v1/quotes/scenarios/INVALID/quote-view"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Scenario not found"
def test_tender_view_invalid_scenario(client):

    response = client.get(
        "/api/v1/quotes/scenarios/INVALID/tender-view"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Scenario not found"

def test_delete_scenario(client, scenario):

    response = client.delete(
        f"/api/v1/quotes/scenarios/{scenario['scenario_id']}"
    )

    assert response.status_code == 204

def test_delete_invalid_scenario(client):

    response = client.delete(
        "/api/v1/quotes/scenarios/INVALID"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Scenario not found"