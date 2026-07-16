from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.modules.directory import service as directory_service
from app.modules.recruiting import service
from app.modules.recruiting.schemas import (
    CandidateCreate,
    CandidateResponse,
    CandidateDetailResponse,
    CandidateStageUpdate,
    InterviewStageCreate,
    InterviewStageResponse,
    ScorecardCreate,
    ScorecardResponse,
    DuplicateFlag,
    FunnelStats,
    HireConversionRequest,
)

router = APIRouter(
    prefix="/api/v1/candidates", tags=["M12 Recruiting / Candidate Pipeline"]
)

interview_stage_router = APIRouter(
    prefix="/api/v1/interview-stages", tags=["M12 Recruiting / Candidate Pipeline"]
)


# ---------- Candidates ----------

@router.post("/", response_model=CandidateResponse, status_code=201)
def log_new_candidate(candidate_in: CandidateCreate, db: Session = Depends(get_db)):
    try:
        return service.create_candidate(db, candidate_in)
    except service.CandidateAlreadyExists:
        raise HTTPException(status_code=400, detail="Candidate ID already exists.")


@router.get("/", response_model=List[CandidateResponse])
def list_pipeline_candidates(
    stage: Optional[str] = None,
    applied_role: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return service.list_candidates(db, stage=stage, applied_role=applied_role)


@router.get("/funnel-stats", response_model=FunnelStats)
def pipeline_funnel_stats(db: Session = Depends(get_db)):
    return service.get_funnel_stats(db)


@router.get("/duplicates", response_model=List[DuplicateFlag])
def flagged_duplicate_candidates(threshold: float = 0.8, db: Session = Depends(get_db)):
    return service.detect_duplicate_candidates(db, threshold=threshold)


@router.get("/{candidate_id}", response_model=CandidateDetailResponse)
def retrieve_candidate_by_id(candidate_id: str, db: Session = Depends(get_db)):
    candidate = service.get_candidate(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return candidate


@router.patch("/{candidate_id}/stage", response_model=CandidateResponse)
def advance_candidate_stage(
    candidate_id: str, stage_update: CandidateStageUpdate, db: Session = Depends(get_db)
):
    try:
        return service.update_candidate_stage(db, candidate_id, stage_update.stage)
    except service.CandidateNotFound:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    except service.InvalidStage:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid stage. Must be one of {service.VALID_STAGES}.",
        )


@router.post(
    "/{candidate_id}/interview-stages",
    response_model=InterviewStageResponse,
    status_code=201,
)
def log_interview_stage(
    candidate_id: str, stage_in: InterviewStageCreate, db: Session = Depends(get_db)
):
    try:
        return service.add_interview_stage(db, candidate_id, stage_in)
    except service.CandidateNotFound:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    except service.InterviewStageAlreadyExists:
        raise HTTPException(status_code=400, detail="Interview stage ID already exists.")


@router.get(
    "/{candidate_id}/interview-stages", response_model=List[InterviewStageResponse]
)
def list_candidate_interview_stages(candidate_id: str, db: Session = Depends(get_db)):
    if not service.get_candidate(db, candidate_id):
        raise HTTPException(status_code=404, detail="Candidate not found.")
    return service.list_interview_stages_for_candidate(db, candidate_id)


@router.post("/{candidate_id}/convert-to-employee", response_model=CandidateResponse)
def convert_hired_candidate(
    candidate_id: str, conversion_in: HireConversionRequest, db: Session = Depends(get_db)
):
    try:
        return service.convert_candidate_to_employee(db, candidate_id, conversion_in)
    except service.CandidateNotFound:
        raise HTTPException(status_code=404, detail="Candidate not found.")
    except service.CandidateAlreadyConverted:
        raise HTTPException(
            status_code=400,
            detail="Candidate has already been converted to an employee.",
        )
    except directory_service.EmployeeAlreadyExists:
        raise HTTPException(status_code=400, detail="Employee code already exists.")


# ---------- Interview stages / scorecards ----------

@interview_stage_router.post(
    "/{stage_id}/scorecards", response_model=ScorecardResponse, status_code=201
)
def attach_stage_scorecard(
    stage_id: str, scorecard_in: ScorecardCreate, db: Session = Depends(get_db)
):
    try:
        return service.add_scorecard(db, stage_id, scorecard_in)
    except service.InterviewStageNotFound:
        raise HTTPException(status_code=404, detail="Interview stage not found.")
    except service.ScorecardAlreadyExists:
        raise HTTPException(status_code=400, detail="Scorecard ID already exists.")