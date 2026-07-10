from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.modules.training.database import get_db
from app.modules.training.models import (
    TrainingProgram,
    TrainingUnit,
)
from app.modules.training.schemas import (
    TrainingProgramCreate,
    TrainingProgramResponse,
    TrainingUnitCreate,
    TrainingUnitResponse,
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

@router.post(
    "/programs/{program_id}/units",
    response_model=TrainingUnitResponse,
    status_code=201,
)
def create_training_unit(
    program_id: int,
    unit_in: TrainingUnitCreate,
    db: Session = Depends(get_db),
):
    """
    Add a training unit to an existing training program.
    """

    program = (
        db.query(TrainingProgram)
        .filter(TrainingProgram.program_id == program_id)
        .first()
    )

    if not program:
        raise HTTPException(
            status_code=404,
            detail="Training program not found.",
        )

    duplicate_sequence = (
        db.query(TrainingUnit)
        .filter(
            TrainingUnit.program_id == program_id,
            TrainingUnit.sequence == unit_in.sequence,
        )
        .first()
    )

    if duplicate_sequence:
        raise HTTPException(
            status_code=400,
            detail="A unit with this sequence already exists in the program.",
        )

    new_unit = TrainingUnit(
        program_id=program_id,
        name=unit_in.name,
        sequence=unit_in.sequence,
    )

    db.add(new_unit)
    db.commit()
    db.refresh(new_unit)

    return new_unit


@router.get(
    "/programs/{program_id}/units",
    response_model=List[TrainingUnitResponse],
)
def list_training_units(
    program_id: int,
    db: Session = Depends(get_db),
):
    """
    Return all units of a training program in sequence order.
    """

    program = (
        db.query(TrainingProgram)
        .filter(TrainingProgram.program_id == program_id)
        .first()
    )

    if not program:
        raise HTTPException(
            status_code=404,
            detail="Training program not found.",
        )

    return (
        db.query(TrainingUnit)
        .filter(TrainingUnit.program_id == program_id)
        .order_by(TrainingUnit.sequence)
        .all()
    )