import pytest
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.modules.calendar import service, schemas
from app.modules.calendar.models import Holiday, CompanyEvent


# ==========================================
# Database Fixture
# ==========================================

@pytest.fixture
def db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )

    db = TestingSessionLocal()
    yield db
    db.close()


# ==========================================
# Helper Functions
# ==========================================

def create_holiday(db):
    holiday = schemas.HolidayCreate(
        name="Independence Day",
        date=date(2026, 8, 15),
        state="National",
    )
    return service.create_holiday(db, holiday)


def create_event(db):
    event = schemas.CompanyEventCreate(
        title="Annual Meeting",
        date=date(2026, 8, 20),
        location="Hyderabad",
    )
    return service.create_company_event(db, event)


# ==========================================
# Holiday Tests
# ==========================================

def test_create_holiday(db):
    holiday = create_holiday(db)

    assert holiday is not None
    assert holiday.holiday_id.startswith("HOL")
    assert holiday.name == "Independence Day"
    assert holiday.state == "National"


def test_get_holidays(db):
    create_holiday(db)

    holidays = service.get_holidays(db)

    assert len(holidays) == 1
    assert holidays[0].name == "Independence Day"


def test_update_holiday(db):
    holiday = create_holiday(db)

    update = schemas.HolidayUpdate(
        name="Republic Day",
        date=date(2026, 1, 26),
        state="National",
    )

    updated = service.update_holiday(
        db,
        holiday.holiday_id,
        update,
    )

    assert updated.name == "Republic Day"


def test_update_holiday_not_found(db):
    update = schemas.HolidayUpdate(
        name="Republic Day",
        date=date(2026, 1, 26),
        state="National",
    )

    updated = service.update_holiday(
        db,
        "INVALID",
        update,
    )

    assert updated is None


def test_delete_holiday(db):
    holiday = create_holiday(db)

    deleted = service.delete_holiday(
        db,
        holiday.holiday_id,
    )

    assert deleted is not None


def test_delete_holiday_not_found(db):
    deleted = service.delete_holiday(
        db,
        "INVALID",
    )

    assert deleted is None


# ==========================================
# Company Event Tests
# ==========================================

def test_create_company_event(db):
    event = create_event(db)

    assert event is not None
    assert event.event_id.startswith("EVT")
    assert event.title == "Annual Meeting"


def test_get_company_events(db):
    create_event(db)

    events = service.get_company_events(db)

    assert len(events) == 1
    assert events[0].title == "Annual Meeting"


def test_update_company_event(db):
    event = create_event(db)

    update = schemas.CompanyEventUpdate(
        title="Town Hall",
        date=date(2026, 8, 25),
        location="Bangalore",
    )

    updated = service.update_company_event(
        db,
        event.event_id,
        update,
    )

    assert updated.title == "Town Hall"


def test_update_company_event_not_found(db):
    update = schemas.CompanyEventUpdate(
        title="Town Hall",
        date=date(2026, 8, 25),
        location="Bangalore",
    )

    updated = service.update_company_event(
        db,
        "INVALID",
        update,
    )

    assert updated is None


def test_delete_company_event(db):
    event = create_event(db)

    deleted = service.delete_company_event(
        db,
        event.event_id,
    )

    assert deleted is True


def test_delete_company_event_not_found(db):
    deleted = service.delete_company_event(
        db,
        "INVALID",
    )

    assert deleted is False