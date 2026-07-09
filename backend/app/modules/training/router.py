from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.modules.training.database import get_db
from app.modules.training.models import TrainingProgram
from app.modules.training.schemas import (
    TrainingProgramCreate,
    TrainingProgramResponse,
)


router = APIRouter(
    prefix="/training",
    tags=["Training"],
)


@router.get("/")
def training_home():
    """
    Basic health endpoint for the M6 Training module.
    """

    return {
        "module": "Training",
        "status": "Working",
    }


@router.post(
    "/programs",
    response_model=TrainingProgramResponse,
    status_code=201,
)
def create_training_program(
    program_in: TrainingProgramCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new training program.
    """

    existing_program = (
        db.query(TrainingProgram)
        .filter(TrainingProgram.name == program_in.name)
        .first()
    )

    if existing_program:
        raise HTTPException(
            status_code=400,
            detail="A training program with this name already exists.",
        )

    new_program = TrainingProgram(
        name=program_in.name,
    )

    db.add(new_program)
    db.commit()
    db.refresh(new_program)

    return new_program


@router.get(
    "/programs",
    response_model=List[TrainingProgramResponse],
)
def list_training_programs(
    db: Session = Depends(get_db),
):
    """
    Return all available training programs.
    """

    return db.query(TrainingProgram).all()