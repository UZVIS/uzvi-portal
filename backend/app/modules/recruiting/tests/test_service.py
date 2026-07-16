import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
import app.modules.directory.models  # noqa: F401 — registers Employee/Team for the FK
from app.modules.directory import service as directory_service

from app.modules.recruiting import service
from app.modules.recruiting.schemas import (
    CandidateCreate,
    InterviewStageCreate,
    ScorecardCreate,
    HireConversionRequest,
)


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_create_and_get_candidate(db):
    candidate_in = CandidateCreate(
        candidate_id="C001",
        name="Priya Sharma",
        applied_role="Backend Engineer",
        source="LinkedIn",
        resume_details="Built a FastAPI microservice for order processing with Postgres.",
    )
    created = service.create_candidate(db, candidate_in)
    assert created.candidate_id == "C001"
    assert created.stage == "Applied"

    fetched = service.get_candidate(db, "C001")
    assert fetched.name == "Priya Sharma"


def test_create_duplicate_candidate_raises(db):
    candidate_in = CandidateCreate(
        candidate_id="C001", name="Priya Sharma", applied_role="Backend Engineer"
    )
    service.create_candidate(db, candidate_in)
    with pytest.raises(service.CandidateAlreadyExists):
        service.create_candidate(db, candidate_in)


def test_update_candidate_stage(db):
    service.create_candidate(
        db, CandidateCreate(candidate_id="C001", name="Priya Sharma", applied_role="Backend Engineer")
    )
    updated = service.update_candidate_stage(db, "C001", "Screened")
    assert updated.stage == "Screened"


def test_update_stage_invalid_raises(db):
    service.create_candidate(
        db, CandidateCreate(candidate_id="C001", name="Priya Sharma", applied_role="Backend Engineer")
    )
    with pytest.raises(service.InvalidStage):
        service.update_candidate_stage(db, "C001", "NotAStage")


def test_update_stage_missing_candidate_raises(db):
    with pytest.raises(service.CandidateNotFound):
        service.update_candidate_stage(db, "NOPE", "Screened")


def test_add_interview_stage_and_scorecard(db):
    service.create_candidate(
        db, CandidateCreate(candidate_id="C001", name="Priya Sharma", applied_role="Backend Engineer")
    )
    stage = service.add_interview_stage(
        db,
        "C001",
        InterviewStageCreate(
            stage_id="IS001", stage_name="Technical Round 1", notes="Strong on system design"
        ),
    )
    assert stage.candidate_id == "C001"

    scorecard = service.add_scorecard(
        db,
        "IS001",
        ScorecardCreate(
            scorecard_id="SC001", questions="Explain your order-processing project", score=8.5
        ),
    )
    assert scorecard.stage_id == "IS001"
    assert scorecard.score == 8.5


def test_add_interview_stage_missing_candidate_raises(db):
    with pytest.raises(service.CandidateNotFound):
        service.add_interview_stage(
            db, "NOPE", InterviewStageCreate(stage_id="IS001", stage_name="Screen")
        )


def test_add_scorecard_missing_stage_raises(db):
    with pytest.raises(service.InterviewStageNotFound):
        service.add_scorecard(db, "NOPE", ScorecardCreate(scorecard_id="SC001", score=5))


def test_detect_duplicate_candidates(db):
    service.create_candidate(
        db,
        CandidateCreate(
            candidate_id="C001",
            name="Priya Sharma",
            applied_role="Backend Engineer",
            resume_details="Built a FastAPI microservice for order processing with Postgres and Docker.",
        ),
    )
    service.create_candidate(
        db,
        CandidateCreate(
            candidate_id="C002",
            name="Rahul Verma",
            applied_role="Backend Engineer",
            resume_details="Built a FastAPI microservice for order processing with Postgres and Docker.",
        ),
    )
    service.create_candidate(
        db,
        CandidateCreate(
            candidate_id="C003",
            name="Meera Iyer",
            applied_role="Frontend Engineer",
            resume_details="Designed React dashboards with D3 visualizations for a fintech client.",
        ),
    )

    flags = service.detect_duplicate_candidates(db, threshold=0.8)
    flagged_pairs = {(f["candidate_id"], f["other_candidate_id"]) for f in flags}
    assert ("C001", "C002") in flagged_pairs
    assert not any("C003" in pair for pair in flagged_pairs)


def test_convert_candidate_to_employee(db):
    service.create_candidate(
        db, CandidateCreate(candidate_id="C001", name="Priya Sharma", applied_role="Backend Engineer")
    )
    updated = service.convert_candidate_to_employee(
        db, "C001", HireConversionRequest(employee_id="E100")
    )
    assert updated.converted_emp_id == "E100"
    assert updated.stage == "Hired"

    employee = directory_service.get_employee(db, "E100")
    assert employee.name == "Priya Sharma"


def test_convert_candidate_twice_raises(db):
    service.create_candidate(
        db, CandidateCreate(candidate_id="C001", name="Priya Sharma", applied_role="Backend Engineer")
    )
    service.convert_candidate_to_employee(db, "C001", HireConversionRequest(employee_id="E100"))
    with pytest.raises(service.CandidateAlreadyConverted):
        service.convert_candidate_to_employee(db, "C001", HireConversionRequest(employee_id="E101"))


def test_funnel_stats(db):
    service.create_candidate(
        db,
        CandidateCreate(candidate_id="C001", name="A", applied_role="Backend Engineer", source="LinkedIn"),
    )
    service.create_candidate(
        db,
        CandidateCreate(candidate_id="C002", name="B", applied_role="Backend Engineer", source="Referral"),
    )
    service.create_candidate(
        db,
        CandidateCreate(candidate_id="C003", name="C", applied_role="Frontend Engineer", source="LinkedIn"),
    )
    service.update_candidate_stage(db, "C002", "Screened")

    stats = service.get_funnel_stats(db)
    stage_counts = {s["stage"]: s["count"] for s in stats["by_stage"]}
    assert stage_counts["Applied"] == 2
    assert stage_counts["Screened"] == 1
    assert stats["by_role"]["Backend Engineer"] == 2
    assert stats["by_source"]["LinkedIn"] == 2