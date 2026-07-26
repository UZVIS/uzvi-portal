import uuid
from datetime import date

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.modules.announcements.models import Announcement, AnnouncementAck
from app.modules.announcements.schemas import AnnouncementCreate, AnnouncementUpdate
from app.modules.directory.models import Employee

VALID_TARGET_TYPES = {"company_wide", "team", "role"}

# FR-ANN-01: Admin/Manager shall post announcements.
POSTER_ALLOWED_TIERS = {"Admin/Leadership", "Manager"}


class AnnouncementNotFound(Exception):
    pass


class PosterNotFound(Exception):
    pass


class UnauthorizedPoster(Exception):
    pass


class InvalidTargetType(Exception):
    pass


class TargetValueRequired(Exception):
    pass


class AcknowledgmentNotRequired(Exception):
    pass


class EmployeeNotFound(Exception):
    pass


def _get_employee(db: Session, employee_id: str) -> Employee | None:
    return db.query(Employee).filter(Employee.employee_id == employee_id).first()


def create_announcement(db: Session, announcement_in: AnnouncementCreate) -> Announcement:
    poster = _get_employee(db, announcement_in.posted_by)
    if not poster:
        raise PosterNotFound(announcement_in.posted_by)

    # NFR-SEC-01: RBAC enforced at the API/service layer, not just hidden in the UI.
    if poster.access_tier not in POSTER_ALLOWED_TIERS:
        raise UnauthorizedPoster(poster.employee_id)

    if announcement_in.target_type not in VALID_TARGET_TYPES:
        raise InvalidTargetType(announcement_in.target_type)

    if announcement_in.target_type in ("team", "role") and not announcement_in.target_value:
        raise TargetValueRequired(announcement_in.target_type)

    new_announcement = Announcement(
        announcement_id=uuid.uuid4().hex,
        **announcement_in.model_dump(),
    )
    db.add(new_announcement)
    db.commit()
    db.refresh(new_announcement)
    return new_announcement


def get_announcement(db: Session, announcement_id: str) -> Announcement | None:
    return (
        db.query(Announcement)
        .filter(Announcement.announcement_id == announcement_id)
        .first()
    )


def update_announcement(
    db: Session, announcement_id: str, updates: AnnouncementUpdate
) -> Announcement:
    """Edit an existing announcement. Only Admin/Leadership or Manager tiers
    may edit (same RBAC rule as posting), enforced here at the service
    layer per NFR-SEC-01 rather than only in the UI. Only fields the
    caller actually set are changed (partial update)."""
    announcement = get_announcement(db, announcement_id)
    if not announcement:
        raise AnnouncementNotFound(announcement_id)

    editor = _get_employee(db, updates.edited_by)
    if not editor:
        raise PosterNotFound(updates.edited_by)
    if editor.access_tier not in POSTER_ALLOWED_TIERS:
        raise UnauthorizedPoster(editor.employee_id)

    data = updates.model_dump(exclude={"edited_by"}, exclude_unset=True)

    new_target_type = data.get("target_type", announcement.target_type)
    new_target_value = data.get("target_value", announcement.target_value)

    if "target_type" in data and data["target_type"] not in VALID_TARGET_TYPES:
        raise InvalidTargetType(data["target_type"])

    if new_target_type in ("team", "role") and not new_target_value:
        raise TargetValueRequired(new_target_type)

    for field, value in data.items():
        setattr(announcement, field, value)

    db.commit()
    db.refresh(announcement)
    return announcement


def delete_announcement(db: Session, announcement_id: str) -> None:
    """Permanently remove an announcement (e.g. cleaning up a duplicate post)."""
    announcement = get_announcement(db, announcement_id)
    if not announcement:
        raise AnnouncementNotFound(announcement_id)

    db.query(AnnouncementAck).filter(
        AnnouncementAck.announcement_id == announcement_id
    ).delete()
    db.delete(announcement)
    db.commit()


def _archive_expired(db: Session) -> None:
    """FR-ANN-04: archived (not deleted) after expiry."""
    today = date.today()
    expired = (
        db.query(Announcement)
        .filter(Announcement.status == "active")
        .filter(Announcement.expiry_date.isnot(None))
        .filter(Announcement.expiry_date < today)
        .all()
    )
    for ann in expired:
        ann.status = "archived"
    if expired:
        db.commit()


def list_all_announcements(db: Session) -> list[Announcement]:
    """Admin/org-wide view: every announcement (any status), newest first."""
    _archive_expired(db)
    return db.query(Announcement).order_by(Announcement.posted_at.desc()).all()


def list_visible_announcements(db: Session, employee_id: str) -> list[Announcement]:
    """FR-ANN-02: employee landing view — company-wide + their team + their role, active only."""
    employee = _get_employee(db, employee_id)
    if not employee:
        raise EmployeeNotFound(employee_id)

    _archive_expired(db)

    visibility_filters = [Announcement.target_type == "company_wide"]
    if employee.team_id:
        visibility_filters.append(
            (Announcement.target_type == "team")
            & (Announcement.target_value == employee.team_id)
        )
    visibility_filters.append(
        (Announcement.target_type == "role")
        & (Announcement.target_value == employee.access_tier)
    )

    return (
        db.query(Announcement)
        .filter(Announcement.status == "active")
        .filter(or_(*visibility_filters))
        .order_by(Announcement.posted_at.desc())
        .all()
    )


def _resolve_target_employees(db: Session, announcement: Announcement) -> list[Employee]:
    query = db.query(Employee).filter(Employee.employment_status == "active")
    if announcement.target_type == "team":
        query = query.filter(Employee.team_id == announcement.target_value)
    elif announcement.target_type == "role":
        query = query.filter(Employee.access_tier == announcement.target_value)
    return query.all()


def acknowledge_announcement(
    db: Session, announcement_id: str, employee_id: str
) -> AnnouncementAck:
    announcement = get_announcement(db, announcement_id)
    if not announcement:
        raise AnnouncementNotFound(announcement_id)

    if not announcement.requires_ack:
        raise AcknowledgmentNotRequired(announcement_id)

    employee = _get_employee(db, employee_id)
    if not employee:
        raise EmployeeNotFound(employee_id)

    existing = (
        db.query(AnnouncementAck)
        .filter(
            AnnouncementAck.announcement_id == announcement_id,
            AnnouncementAck.employee_id == employee_id,
        )
        .first()
    )
    if existing:
        return existing

    ack = AnnouncementAck(
        id=uuid.uuid4().hex,
        announcement_id=announcement_id,
        employee_id=employee_id,
    )
    db.add(ack)
    db.commit()
    db.refresh(ack)
    return ack


def get_acknowledgment_status(db: Session, announcement_id: str) -> list[dict]:
    """FR-ANN-03: who among the target audience has/hasn't acknowledged."""
    announcement = get_announcement(db, announcement_id)
    if not announcement:
        raise AnnouncementNotFound(announcement_id)

    target_employees = _resolve_target_employees(db, announcement)
    acked_rows = (
        db.query(AnnouncementAck)
        .filter(AnnouncementAck.announcement_id == announcement_id)
        .all()
    )
    acked_map = {row.employee_id: row.acknowledged_at for row in acked_rows}

    return [
        {
            "employee_id": emp.employee_id,
            "acknowledged": emp.employee_id in acked_map,
            "acknowledged_at": acked_map.get(emp.employee_id),
        }
        for emp in target_employees
    ]