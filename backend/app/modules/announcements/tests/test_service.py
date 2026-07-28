import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.modules.directory.models import Employee, Team  # noqa: F401 (registers tables)
from app.modules.announcements.models import Announcement, AnnouncementAck  # noqa: F401
from app.modules.announcements import service
from app.modules.announcements.schemas import AnnouncementCreate


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()


def _make_employee(db, employee_id, access_tier="Employee", team_id=None):
    emp = Employee(
        employee_id=employee_id,
        name=f"Test {employee_id}",
        access_tier=access_tier,
        team_id=team_id,
        employment_status="active",
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


def _make_team(db, team_id, name="Engineering"):
    team = Team(team_id=team_id, name=name)
    db.add(team)
    db.commit()
    return team


def test_create_announcement_success(db_session):
    admin = _make_employee(db_session, "E1", access_tier="Admin/Leadership")
    ann_in = AnnouncementCreate(
        title="Holiday Notice",
        body="Office closed Friday.",
        target_type="company_wide",
        posted_by=admin.employee_id,
    )
    ann = service.create_announcement(db_session, ann_in)
    assert ann.announcement_id
    assert ann.status == "active"


def test_create_announcement_unauthorized_poster(db_session):
    emp = _make_employee(db_session, "E2", access_tier="Employee")
    ann_in = AnnouncementCreate(
        title="Not allowed",
        body="Should fail.",
        target_type="company_wide",
        posted_by=emp.employee_id,
    )
    with pytest.raises(service.UnauthorizedPoster):
        service.create_announcement(db_session, ann_in)


def test_create_announcement_missing_target_value(db_session):
    admin = _make_employee(db_session, "E3", access_tier="Admin/Leadership")
    ann_in = AnnouncementCreate(
        title="Team update",
        body="For engineering only.",
        target_type="team",
        posted_by=admin.employee_id,
    )
    with pytest.raises(service.TargetValueRequired):
        service.create_announcement(db_session, ann_in)


def test_visible_announcements_filters_by_team(db_session):
    _make_team(db_session, "T1", "Engineering")
    admin = _make_employee(db_session, "E4", access_tier="Admin/Leadership")
    eng_emp = _make_employee(db_session, "E5", team_id="T1")
    other_emp = _make_employee(db_session, "E6", team_id=None)

    company_ann = AnnouncementCreate(
        title="Company wide",
        body="Everyone sees this.",
        target_type="company_wide",
        posted_by=admin.employee_id,
    )
    team_ann = AnnouncementCreate(
        title="Engineering only",
        body="Team T1 only.",
        target_type="team",
        target_value="T1",
        posted_by=admin.employee_id,
    )
    service.create_announcement(db_session, company_ann)
    service.create_announcement(db_session, team_ann)

    eng_feed = service.list_visible_announcements(db_session, eng_emp.employee_id)
    other_feed = service.list_visible_announcements(db_session, other_emp.employee_id)

    assert len(eng_feed) == 2
    assert len(other_feed) == 1


def test_acknowledgment_flow(db_session):
    admin = _make_employee(db_session, "E7", access_tier="Admin/Leadership")
    emp = _make_employee(db_session, "E8")

    ann_in = AnnouncementCreate(
        title="Policy update",
        body="Please acknowledge.",
        target_type="company_wide",
        requires_ack=True,
        posted_by=admin.employee_id,
    )
    ann = service.create_announcement(db_session, ann_in)

    ack = service.acknowledge_announcement(
        db_session, ann.announcement_id, emp.employee_id
    )
    assert ack.employee_id == emp.employee_id

    status = service.get_acknowledgment_status(db_session, ann.announcement_id)
    acked_map = {row["employee_id"]: row["acknowledged"] for row in status}
    assert acked_map[emp.employee_id] is True
    assert acked_map[admin.employee_id] is False


def test_acknowledge_without_requirement_raises(db_session):
    admin = _make_employee(db_session, "E9", access_tier="Admin/Leadership")
    emp = _make_employee(db_session, "E10")

    ann_in = AnnouncementCreate(
        title="No ack needed",
        body="FYI only.",
        target_type="company_wide",
        requires_ack=False,
        posted_by=admin.employee_id,
    )
    ann = service.create_announcement(db_session, ann_in)

    with pytest.raises(service.AcknowledgmentNotRequired):
        service.acknowledge_announcement(db_session, ann.announcement_id, emp.employee_id)


def test_expired_announcement_is_archived_on_list(db_session):
    from datetime import date, timedelta

    admin = _make_employee(db_session, "E11", access_tier="Admin/Leadership")
    ann_in = AnnouncementCreate(
        title="Old notice",
        body="Already expired.",
        target_type="company_wide",
        posted_by=admin.employee_id,
        expiry_date=date.today() - timedelta(days=1),
    )
    ann = service.create_announcement(db_session, ann_in)
    assert ann.status == "active"

    service.list_all_announcements(db_session)
    refreshed = service.get_announcement(db_session, ann.announcement_id)
    assert refreshed.status == "archived"