from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.modules.training.database import get_db
from app.modules.training.models import (
    Enrollment,
    TrainingProgram,
    TrainingUnit,
    UnitCompletion,
)

from app.modules.directory.models import Employee

from app.modules.training.schemas import (
    CohortProgressResponse,
    EnrollmentCreate,
    EnrollmentResponse,
    ProgressResponse,
    TrainingProgramCreate,
    TrainingProgramResponse,
    TrainingUnitCreate,
    TrainingUnitResponse,
    UnitCompletionCreate,
    UnitCompletionResponse,
)

router = APIRouter(
    prefix="/training",
    tags=["Training"],
)

# Health API
@router.get("/")
def training_home():
    """
    Basic health endpoint for the M6 Training module.
    """

    return {
        "module": "Training",
        "status": "Working",
    }

# Training Program APIs
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

# Training Unit APIs
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

#enrollment APIs
@router.post(
    "/enrollments",
    response_model=EnrollmentResponse,
    status_code=201,
)
def create_enrollment(
    enrollment_in: EnrollmentCreate,
    db: Session = Depends(get_db),
):
    """
    Enroll an existing employee into a training program.
    """

    employee = (
        db.query(Employee)
        .filter(Employee.employee_id == enrollment_in.employee_id)
        .first()
    )

    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found.",
        )

    program = (
        db.query(TrainingProgram)
        .filter(
            TrainingProgram.program_id == enrollment_in.program_id
        )
        .first()
    )

    if not program:
        raise HTTPException(
            status_code=404,
            detail="Training program not found.",
        )

    existing_enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.employee_id == enrollment_in.employee_id,
            Enrollment.program_id == enrollment_in.program_id,
        )
        .first()
    )

    if existing_enrollment:
        raise HTTPException(
            status_code=400,
            detail="Employee is already enrolled in this program.",
        )

    new_enrollment = Enrollment(
        employee_id=enrollment_in.employee_id,
        program_id=enrollment_in.program_id,
    )

    db.add(new_enrollment)
    db.commit()
    db.refresh(new_enrollment)

    return new_enrollment


@router.get(
    "/enrollments",
    response_model=List[EnrollmentResponse],
)
def list_enrollments(
    db: Session = Depends(get_db),
):
    """
    Return all training enrollments.
    """

    return db.query(Enrollment).all()

#Unit completion APIs
@router.post(
    "/completions",
    response_model=UnitCompletionResponse,
    status_code=201,
)
def complete_training_unit(
    completion_in: UnitCompletionCreate,
    db: Session = Depends(get_db),
):
    """
    Mark a unit as completed.
    """

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.enrollment_id
            == completion_in.enrollment_id
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=404,
            detail="Enrollment not found.",
        )

    unit = (
        db.query(TrainingUnit)
        .filter(
            TrainingUnit.unit_id
            == completion_in.unit_id
        )
        .first()
    )

    if not unit:
        raise HTTPException(
            status_code=404,
            detail="Training unit not found.",
        )

    if enrollment.program_id != unit.program_id:
        raise HTTPException(
            status_code=400,
            detail="Training unit does not belong to enrolled program.",
        )

    existing_completion = (
        db.query(UnitCompletion)
        .filter(
            UnitCompletion.enrollment_id
            == completion_in.enrollment_id,
            UnitCompletion.unit_id
            == completion_in.unit_id,
        )
        .first()
    )

    if existing_completion:
        raise HTTPException(
            status_code=400,
            detail="Unit already completed.",
        )

    completion = UnitCompletion(
        enrollment_id=completion_in.enrollment_id,
        unit_id=completion_in.unit_id,
        score=completion_in.score,
    )

    db.add(completion)
    db.commit()
    db.refresh(completion)

    return completion

@router.get(
    "/completions",
    response_model=List[UnitCompletionResponse],
)
def list_completions(
    db: Session = Depends(get_db),
):
    """
    List all completed units.
    """

    return db.query(UnitCompletion).all()

#Employee Progress APIs
@router.get(
    "/progress/{employee_id}",
    response_model=ProgressResponse,
)
def get_employee_progress(
    employee_id: str,
    db: Session = Depends(get_db),
):
    """
    Return real training progress for an employee.
    """

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.employee_id == employee_id
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=404,
            detail="Employee is not enrolled in any training program.",
        )

    total_units = (
        db.query(TrainingUnit)
        .filter(
            TrainingUnit.program_id == enrollment.program_id
        )
        .count()
    )

    completed_units = (
        db.query(UnitCompletion)
        .filter(
            UnitCompletion.enrollment_id
            == enrollment.enrollment_id
        )
        .count()
    )

    percentage = (
        round(
            (completed_units / total_units) * 100,
            2,
        )
        if total_units
        else 0.0
    )

    return ProgressResponse(
        employee_id=employee_id,
        completed_units=completed_units,
        total_units=total_units,
        completion_percentage=percentage,
    )

@router.get(
    "/cohort-progress/{program_id}",
    response_model=CohortProgressResponse,
)
def get_cohort_progress(
    program_id: int,
    db: Session = Depends(get_db),
):
    """
    Return progress statistics for an entire training program.
    """

    program = (
        db.query(TrainingProgram)
        .filter(
            TrainingProgram.program_id == program_id
        )
        .first()
    )

    if not program:
        raise HTTPException(
            status_code=404,
            detail="Training program not found.",
        )

    enrollments = (
        db.query(Enrollment)
        .filter(
            Enrollment.program_id == program_id
        )
        .all()
    )

    total_units = (
        db.query(TrainingUnit)
        .filter(
            TrainingUnit.program_id == program_id
        )
        .count()
    )

    total_enrollments = len(enrollments)

    completed_enrollments = 0
    total_percentage = 0.0

    for enrollment in enrollments:

        completed_units = (
            db.query(UnitCompletion)
            .filter(
                UnitCompletion.enrollment_id
                == enrollment.enrollment_id
            )
            .count()
        )

        percentage = (
            (completed_units / total_units) * 100
            if total_units
            else 0
        )

        total_percentage += percentage

        if (
            total_units > 0
            and completed_units == total_units
        ):
            completed_enrollments += 1

    average_percentage = (
        round(
            total_percentage / total_enrollments,
            2,
        )
        if total_enrollments
        else 0.0
    )

    return CohortProgressResponse(
        program_id=program.program_id,
        program_name=program.name,
        total_enrollments=total_enrollments,
        completed_enrollments=completed_enrollments,
        average_completion_percentage=average_percentage,
    )