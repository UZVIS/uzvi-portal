from collections import defaultdict

from sqlalchemy.orm import Session

from app.modules.directory import service as directory_service
from app.modules.directory.schemas import EmployeeCreate
from app.modules.recruiting.models import Candidate, InterviewStage, Scorecard
from app.modules.recruiting.schemas import (
    CandidateCreate,
    InterviewStageCreate,
    ScorecardCreate,
    HireConversionRequest,
)

VALID_STAGES = ["Applied", "Screened", "Interview", "Offer", "Hired", "Rejected"]


class CandidateAlreadyExists(Exception):
    pass


class CandidateNotFound(Exception):
    pass


class InvalidStage(Exception):
    pass


class InterviewStageAlreadyExists(Exception):
    pass


class InterviewStageNotFound(Exception):
    pass


class ScorecardAlreadyExists(Exception):
    pass


class CandidateAlreadyConverted(Exception):
    pass


# ---------- Candidate CRUD: FR-REC-01, FR-REC-02 ----------

def create_candidate(db: Session, candidate_in: CandidateCreate) -> Candidate:
    if get_candidate(db, candidate_in.candidate_id):
        raise CandidateAlreadyExists(candidate_in.candidate_id)

    new_candidate = Candidate(**candidate_in.model_dump())
    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)
    return new_candidate


def get_candidate(db: Session, candidate_id: str) -> Candidate | None:
    return db.query(Candidate).filter(Candidate.candidate_id == candidate_id).first()


def list_candidates(
    db: Session, stage: str | None = None, applied_role: str | None = None
) -> list[Candidate]:
    query = db.query(Candidate)
    if stage:
        query = query.filter(Candidate.stage == stage)
    if applied_role:
        query = query.filter(Candidate.applied_role == applied_role)
    return query.all()


def update_candidate_stage(db: Session, candidate_id: str, new_stage: str) -> Candidate:
    candidate = get_candidate(db, candidate_id)
    if not candidate:
        raise CandidateNotFound(candidate_id)
    if new_stage not in VALID_STAGES:
        raise InvalidStage(new_stage)

    candidate.stage = new_stage
    db.commit()
    db.refresh(candidate)
    return candidate


def update_candidate(db: Session, candidate_id: str, updates: dict) -> Candidate:
    candidate = get_candidate(db, candidate_id)
    if not candidate:
        raise CandidateNotFound(candidate_id)

    if "stage" in updates and updates["stage"] is not None and updates["stage"] not in VALID_STAGES:
        raise InvalidStage(updates["stage"])

    for field, value in updates.items():
        if value is not None:
            setattr(candidate, field, value)

    db.commit()
    db.refresh(candidate)
    return candidate


def delete_candidate(db: Session, candidate_id: str) -> None:
    candidate = get_candidate(db, candidate_id)
    if not candidate:
        raise CandidateNotFound(candidate_id)

    db.query(Scorecard).filter(
        Scorecard.stage_id.in_(
            db.query(InterviewStage.stage_id).filter(
                InterviewStage.candidate_id == candidate_id
            )
        )
    ).delete(synchronize_session=False)
    db.query(InterviewStage).filter(
        InterviewStage.candidate_id == candidate_id
    ).delete(synchronize_session=False)

    db.delete(candidate)
    db.commit()


# ---------- Interview stages & scorecards: FR-REC-02, FR-REC-03 ----------

def add_interview_stage(
    db: Session, candidate_id: str, stage_in: InterviewStageCreate
) -> InterviewStage:
    if not get_candidate(db, candidate_id):
        raise CandidateNotFound(candidate_id)
    if get_interview_stage(db, stage_in.stage_id):
        raise InterviewStageAlreadyExists(stage_in.stage_id)

    new_stage = InterviewStage(candidate_id=candidate_id, **stage_in.model_dump())
    db.add(new_stage)
    db.commit()
    db.refresh(new_stage)
    return new_stage


def get_interview_stage(db: Session, stage_id: str) -> InterviewStage | None:
    return (
        db.query(InterviewStage).filter(InterviewStage.stage_id == stage_id).first()
    )


def list_interview_stages_for_candidate(
    db: Session, candidate_id: str
) -> list[InterviewStage]:
    return (
        db.query(InterviewStage)
        .filter(InterviewStage.candidate_id == candidate_id)
        .all()
    )


def add_scorecard(
    db: Session, stage_id: str, scorecard_in: ScorecardCreate
) -> Scorecard:
    stage = get_interview_stage(db, stage_id)
    if not stage:
        raise InterviewStageNotFound(stage_id)

    existing = (
        db.query(Scorecard)
        .filter(Scorecard.scorecard_id == scorecard_in.scorecard_id)
        .first()
    )
    if existing:
        raise ScorecardAlreadyExists(scorecard_in.scorecard_id)

    new_scorecard = Scorecard(stage_id=stage_id, **scorecard_in.model_dump())
    db.add(new_scorecard)
    db.commit()
    db.refresh(new_scorecard)
    return new_scorecard


# ---------- FR-REC-04: duplicate candidate detection ----------

def _normalize_aadhar(value: str | None) -> str | None:
    """Aadhar numbers are 12 digits; ignore formatting differences (spaces/
    hyphens) so e.g. '1234 5678 9012' and '1234-5678-9012' are still treated
    as the same candidate."""
    if not value:
        return None
    digits = "".join(ch for ch in value if ch.isdigit())
    return digits or None


def detect_duplicate_candidates(db: Session) -> list[dict]:
    """Flags candidates that share the same Aadhar card number, per
    FR-REC-04. This is an exact-match check (not a fuzzy/similarity check):
    a real, unique government ID is a far more reliable duplicate signal
    than comparing resume text. Candidates with no Aadhar number on file are
    skipped since there's nothing to match on."""
    candidates = db.query(Candidate).all()

    by_aadhar: dict[str, list[Candidate]] = defaultdict(list)
    for candidate in candidates:
        normalized = _normalize_aadhar(candidate.aadhar_number)
        if normalized:
            by_aadhar[normalized].append(candidate)

    flags: list[dict] = []
    for normalized, group in by_aadhar.items():
        if len(group) < 2:
            continue
        for i in range(len(group)):
            for j in range(i + 1, len(group)):
                c1, c2 = group[i], group[j]
                flags.append(
                    {
                        "candidate_id": c1.candidate_id,
                        "other_candidate_id": c2.candidate_id,
                        "aadhar_number": normalized,
                    }
                )
    return flags


# ---------- FR-REC-05: hire -> Employee Directory conversion ----------

def convert_candidate_to_employee(
    db: Session, candidate_id: str, conversion_in: HireConversionRequest
) -> Candidate:
    """On hire, converts the candidate record into an Employee Directory (M0)
    record without re-entering data (FR-REC-05)."""
    candidate = get_candidate(db, candidate_id)
    if not candidate:
        raise CandidateNotFound(candidate_id)
    if candidate.converted_emp_id:
        raise CandidateAlreadyConverted(candidate_id)

    employee_in = EmployeeCreate(
        employee_id=conversion_in.employee_id,
        name=candidate.name,
        designation=conversion_in.designation or candidate.applied_role,
        team_id=conversion_in.team_id,
        manager_id=conversion_in.manager_id,
        join_date=conversion_in.join_date,
    )
    new_employee = directory_service.create_employee(
        db, employee_in, requester_id=conversion_in.requester_id
    )

    candidate.converted_emp_id = new_employee.employee_id
    candidate.stage = "Hired"
    db.commit()
    db.refresh(candidate)
    return candidate


# ---------- FR-REC-06: pipeline-wide funnel stats ----------

def get_funnel_stats(db: Session) -> dict:
    """
    Builds a true *cumulative* funnel: each stage's count reflects every
    candidate who reached that stage or further, not just who is currently
    sitting there. This assumes the pipeline stages are strictly ordered
    (Applied -> Screened -> Interview -> Offer -> Hired) and that a
    candidate currently at a later stage necessarily passed through every
    earlier one. This is what makes the funnel visualization make sense —
    each stage's bar/count is less than or equal to the one before it,
    showing real drop-off rather than an arbitrary current-day snapshot.

    Rejected candidates are counted toward "Applied" (everyone necessarily
    applied first) but are not credited toward Screened/Interview/Offer/
    Hired, since this data model only stores a candidate's current stage
    and not a history of stages they passed through before being rejected.
    Rejected is reported separately as pipeline exits.
    """
    candidates = db.query(Candidate).all()
    total = len(candidates)

    stage_order = ["Applied", "Screened", "Interview", "Offer", "Hired"]
    stage_index = {stage: i for i, stage in enumerate(stage_order)}

    by_stage: dict[str, int] = {}
    for i, stage in enumerate(stage_order):
        if stage == "Applied":
            by_stage[stage] = total
        else:
            by_stage[stage] = sum(
                1
                for c in candidates
                if c.stage in stage_index and stage_index[c.stage] >= i
            )

    rejected_count = sum(1 for c in candidates if c.stage == "Rejected")
    by_stage["Rejected"] = rejected_count

    by_role: dict[str, int] = {}
    by_source: dict[str, int] = {}

    for c in candidates:
        by_role[c.applied_role] = by_role.get(c.applied_role, 0) + 1
        source_key = c.source or "Unknown"
        by_source[source_key] = by_source.get(source_key, 0) + 1

    return {
        "by_stage": [{"stage": k, "count": v} for k, v in by_stage.items()],
        "by_role": by_role,
        "by_source": by_source,
        "time_in_stage": get_time_in_stage_stats(db, candidates=candidates),
    }


def get_time_in_stage_stats(
    db: Session, candidates: list[Candidate] | None = None
) -> list[dict]:
    """FR-REC-06: average time-in-stage across the candidate pool.

    For each candidate, walks their chronological stage history — starting
    from their application date (Candidate.created_at) and then through
    every logged InterviewStage entry in timestamp order — and attributes
    the gap between consecutive entries to the *earlier* stage, i.e. how
    long the candidate actually sat there before moving on.

    A candidate's current (most recent) stage doesn't contribute a
    duration, since it hasn't ended yet — there's nothing to divide it by.
    Any negative gap (e.g. a stage logged out of order) is skipped rather
    than corrupting the average.
    """
    if candidates is None:
        candidates = db.query(Candidate).all()

    durations_by_stage: dict[str, list[float]] = {}

    for candidate in candidates:
        stage_events = sorted(candidate.interview_stages, key=lambda s: s.timestamp)
        timeline = [("Applied", candidate.created_at)] + [
            (event.stage_name, event.timestamp) for event in stage_events
        ]

        for i in range(len(timeline) - 1):
            stage_name, start_ts = timeline[i]
            _, end_ts = timeline[i + 1]
            duration_days = (end_ts - start_ts).total_seconds() / 86400
            if duration_days < 0:
                continue
            durations_by_stage.setdefault(stage_name, []).append(duration_days)

    return [
        {
            "stage": stage,
            "avg_days_in_stage": round(sum(days) / len(days), 2),
            "candidate_count": len(days),
        }
        for stage, days in durations_by_stage.items()
    ]