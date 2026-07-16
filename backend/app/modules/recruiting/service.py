import difflib
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
DUPLICATE_SIMILARITY_THRESHOLD = 0.8


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


# ---------- FR-REC-04: duplicate resume/content detection ----------

def _similarity(a: str | None, b: str | None) -> float:
    return difflib.SequenceMatcher(None, a or "", b or "").ratio()


def detect_duplicate_candidates(
    db: Session, threshold: float = DUPLICATE_SIMILARITY_THRESHOLD
) -> list[dict]:
    """Flags candidates with highly similar project descriptions/resume content
    across the candidate pool, per FR-REC-04."""
    candidates = db.query(Candidate).all()
    flags: list[dict] = []

    for i in range(len(candidates)):
        for j in range(i + 1, len(candidates)):
            c1, c2 = candidates[i], candidates[j]
            similarity = _similarity(c1.resume_details, c2.resume_details)
            if similarity >= threshold:
                flags.append(
                    {
                        "candidate_id": c1.candidate_id,
                        "other_candidate_id": c2.candidate_id,
                        "similarity": round(similarity, 4),
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
    new_employee = directory_service.create_employee(db, employee_in)

    candidate.converted_emp_id = new_employee.employee_id
    candidate.stage = "Hired"
    db.commit()
    db.refresh(candidate)
    return candidate


# ---------- FR-REC-06: pipeline-wide funnel stats ----------

def get_funnel_stats(db: Session) -> dict:
    candidates = db.query(Candidate).all()

    by_stage: dict[str, int] = {}
    by_role: dict[str, int] = {}
    by_source: dict[str, int] = {}

    for c in candidates:
        by_stage[c.stage] = by_stage.get(c.stage, 0) + 1
        by_role[c.applied_role] = by_role.get(c.applied_role, 0) + 1
        source_key = c.source or "Unknown"
        by_source[source_key] = by_source.get(source_key, 0) + 1

    return {
        "by_stage": [{"stage": k, "count": v} for k, v in by_stage.items()],
        "by_role": by_role,
        "by_source": by_source,
    }