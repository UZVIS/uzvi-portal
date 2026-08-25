import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
 
from app.database import Base
import app.modules.directory.models  # noqa: F401 — registers Employee/Team for the FK
from app.modules.directory.models import Employee
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
            aadhar_number="1234 5678 9012",
        ),
    )
    service.create_candidate(
        db,
        CandidateCreate(
            candidate_id="C002",
            name="Rahul Verma",
            applied_role="Backend Engineer",
            # Same Aadhar number as C001, just formatted differently.
            aadhar_number="1234-5678-9012",
        ),
    )
    service.create_candidate(
        db,
        CandidateCreate(
            candidate_id="C003",
            name="Meera Iyer",
            applied_role="Frontend Engineer",
            aadhar_number="9999 8888 7777",
        ),
    )
    service.create_candidate(
        db,
        CandidateCreate(
            candidate_id="C004",
            name="Arjun Nair",
            applied_role="Frontend Engineer",
        ),
    )
 
    flags = service.detect_duplicate_candidates(db)
    flagged_pairs = {(f["candidate_id"], f["other_candidate_id"]) for f in flags}
    assert ("C001", "C002") in flagged_pairs
    assert not any("C003" in pair for pair in flagged_pairs)
    assert not any("C004" in pair for pair in flagged_pairs)
 
 
def _seed_admin(db, employee_id="ADMIN1"):
    admin = Employee(employee_id=employee_id, name="Admin User", access_tier="Admin/Leadership")
    db.add(admin)
    db.commit()
    return admin
 
 
def test_convert_candidate_to_employee(db):
    _seed_admin(db)
    service.create_candidate(
        db, CandidateCreate(candidate_id="C001", name="Priya Sharma", applied_role="Backend Engineer")
    )
    updated = service.convert_candidate_to_employee(
        db, "C001", HireConversionRequest(requester_id="ADMIN1")
    )
    # employee_id is never taken from the caller — the backend always
    # auto-increments the next EMP### id.
    assert updated.converted_emp_id == "EMP001"
    assert updated.stage == "Hired"
 
    employee = directory_service.get_employee(db, "EMP001")
    assert employee.name == "Priya Sharma"
 
 
def test_convert_candidate_twice_raises(db):
    _seed_admin(db)
    service.create_candidate(
        db, CandidateCreate(candidate_id="C001", name="Priya Sharma", applied_role="Backend Engineer")
    )
    service.convert_candidate_to_employee(
        db, "C001", HireConversionRequest(requester_id="ADMIN1")
    )
    with pytest.raises(service.CandidateAlreadyConverted):
        service.convert_candidate_to_employee(
            db, "C001", HireConversionRequest(requester_id="ADMIN1")
        )
 
 
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
    # Applied is now cumulative: everyone who ever entered the pipeline,
    # including the candidate who has since moved on to Screened.
    assert stage_counts["Applied"] == 3
    assert stage_counts["Screened"] == 1
    assert stats["by_role"]["Backend Engineer"] == 2
    assert stats["by_source"]["LinkedIn"] == 2
    # FR-REC-06: funnel stats also carry a time-in-stage breakdown.
    assert "time_in_stage" in stats
 
 
def test_time_in_stage_stats(db):
    from datetime import datetime
 
    service.create_candidate(
        db,
        CandidateCreate(candidate_id="C001", name="A", applied_role="Backend Engineer"),
    )
    candidate = service.get_candidate(db, "C001")
    candidate.created_at = datetime(2026, 1, 1)
    db.commit()
 
    service.add_interview_stage(
        db,
        "C001",
        InterviewStageCreate(stage_id="S001", stage_name="Screened"),
    )
    screened_stage = service.get_interview_stage(db, "S001")
    screened_stage.timestamp = datetime(2026, 1, 4)  # 3 days after applying
    db.commit()
 
    service.add_interview_stage(
        db,
        "C001",
        InterviewStageCreate(stage_id="S002", stage_name="Interview"),
    )
    interview_stage = service.get_interview_stage(db, "S002")
    interview_stage.timestamp = datetime(2026, 1, 9)  # 5 days after Screened
    db.commit()
 
    results = {row["stage"]: row for row in service.get_time_in_stage_stats(db)}
 
    assert results["Applied"]["avg_days_in_stage"] == 3.0
    assert results["Applied"]["candidate_count"] == 1
    assert results["Screened"]["avg_days_in_stage"] == 5.0
    assert results["Screened"]["candidate_count"] == 1
    # "Interview" is the candidate's current stage — it hasn't ended yet,
    # so it contributes no completed duration.
    assert "Interview" not in results