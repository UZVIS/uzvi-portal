from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.training.models import (
    Enrollment,
    TrainingProgram,
    TrainingUnit,
    UnitCompletion,
)

from app.modules.directory.models import Employee
from app.modules.training.dependencies import (
    COHORT_VIEW_TIERS,
    get_current_employee,
    require_admin,
    require_cohort_viewer,
)

from app.modules.training.schemas import (
    CohortProgressResponse,
    EnrollmentCreate,
    EnrollmentResponse,
    LaggingEnrollee,
    ProgressResponse,
    TrainingProgramCreate,
    TrainingProgramResponse,
    TrainingUnitCreate,
    TrainingUnitResponse,
    UnitCompletionCreate,
    UnitCompletionResponse,
)

# FR-LMS-05: an enrollee is flagged as "falling behind" when their completion
# percentage trails the cohort average by more than this many percentage
# points. Kept as a single named constant so the threshold is easy to tune
# without touching the calculation logic itself.
LAGGING_THRESHOLD_POINTS = 20.0

router = APIRouter(
    prefix="/api/training",
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
    current_employee: Employee = Depends(require_admin),
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
    current_employee: Employee = Depends(get_current_employee),
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
    current_employee: Employee = Depends(require_admin),
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
    current_employee: Employee = Depends(get_current_employee),
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
    current_employee: Employee = Depends(get_current_employee),
):
    """
    Enroll an existing employee into a training program.

    A plain Employee may only self-enroll (FR-LMS-02); enrolling someone
    else is restricted to Manager/Admin-Leadership/HR-Restricted
    (FR-LMS-05), matching the frontend's cohort-viewer check.
    """

    if (
        current_employee.access_tier not in COHORT_VIEW_TIERS
        and enrollment_in.employee_id != current_employee.employee_id
    ):
        raise HTTPException(
            status_code=403,
            detail=f"{current_employee.access_tier} accounts can only enroll themselves.",
        )

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
    current_employee: Employee = Depends(get_current_employee),
):
    """
    Return training enrollments.

    A plain Employee only sees their own enrollments; the full org-wide
    list is restricted to Manager/Admin-Leadership/HR-Restricted
    (FR-LMS-05), matching the frontend's cohort-viewer split.
    """

    query = db.query(Enrollment)

    if current_employee.access_tier not in COHORT_VIEW_TIERS:
        query = query.filter(
            Enrollment.employee_id == current_employee.employee_id
        )

    return query.all()

#Unit completion APIs
@router.post(
    "/completions",
    response_model=UnitCompletionResponse,
    status_code=201,
)
def complete_training_unit(
    completion_in: UnitCompletionCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    """
    Mark a unit as completed.

    Completion is always self-attested. Only the enrolled employee knows
    whether they actually did the training — nobody else, including
    Manager/Admin-Leadership/HR-Restricted, can mark it complete on their
    behalf. This is a hard rule with no privileged-tier exception, matching
    the frontend where the "Mark Complete" form only ever lists the
    signed-in employee's own enrollments.
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

    if enrollment.employee_id != current_employee.employee_id:
        raise HTTPException(
            status_code=403,
            detail="You can only mark your own training units complete.",
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
    )

    db.add(completion)
    db.commit()
    db.refresh(completion)

    return completion

@router.delete(
    "/completions/{completion_id}",
    status_code=204,
)
def undo_unit_completion(
    completion_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    """
    Undo a unit completion (mark it incomplete again).

    Completion is self-attested, so undoing it is subject to the same
    self-only rule as marking it complete in the first place — this is a
    safety net for accidental clicks, not a way for anyone else to alter
    someone's record.
    """

    completion = (
        db.query(UnitCompletion)
        .filter(UnitCompletion.completion_id == completion_id)
        .first()
    )

    if not completion:
        raise HTTPException(
            status_code=404,
            detail="Completion not found.",
        )

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.enrollment_id == completion.enrollment_id
        )
        .first()
    )

    if not enrollment or enrollment.employee_id != current_employee.employee_id:
        raise HTTPException(
            status_code=403,
            detail="You can only undo your own training completions.",
        )

    db.delete(completion)
    db.commit()

    return None

@router.get(
    "/completions",
    response_model=List[UnitCompletionResponse],
)
def list_completions(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    """
    List completed units.

    A plain Employee only sees their own completions; the full org-wide
    list is restricted to Manager/Admin-Leadership/HR-Restricted
    (FR-LMS-05), matching the frontend's cohort-viewer split.
    """

    query = db.query(UnitCompletion)

    if current_employee.access_tier not in COHORT_VIEW_TIERS:
        own_enrollment_ids = [
            enrollment.enrollment_id
            for enrollment in db.query(Enrollment)
            .filter(
                Enrollment.employee_id == current_employee.employee_id
            )
            .all()
        ]
        query = query.filter(
            UnitCompletion.enrollment_id.in_(own_enrollment_ids)
        )

    return query.all()

#Employee Progress APIs
@router.get(
    "/progress/{employee_id}",
    response_model=ProgressResponse,
)
def get_employee_progress(
    employee_id: str,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    """
    Return real training progress for an employee.
    """

    if (
        current_employee.access_tier not in {
            "Manager",
            "Admin/Leadership",
            "HR-Restricted",
        }
        and current_employee.employee_id != employee_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only view your own training progress.",
        )

    enrollments = (
        db.query(Enrollment)
        .filter(
            Enrollment.employee_id == employee_id
        )
        .all()
    )

    if not enrollments:
        raise HTTPException(
            status_code=404,
            detail="Employee is not enrolled in any training program.",
        )

    program_ids = [
        enrollment.program_id for enrollment in enrollments
    ]

    enrollment_ids = [
        enrollment.enrollment_id for enrollment in enrollments
    ]

    total_units = (
        db.query(TrainingUnit)
        .filter(
            TrainingUnit.program_id.in_(program_ids)
        )
        .count()
    )

    completed_units = (
        db.query(UnitCompletion)
        .filter(
            UnitCompletion.enrollment_id.in_(enrollment_ids)
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
        employee_name=enrollments[0].employee_name,
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
    current_employee: Employee = Depends(require_cohort_viewer),
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
    enrollee_percentages = []

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
        enrollee_percentages.append(
            (enrollment.employee_id, enrollment.employee_name, percentage)
        )

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

    # FR-LMS-05: flag enrollees trailing the cohort average by more than
    # LAGGING_THRESHOLD_POINTS. Needs at least two enrollees, otherwise
    # there is no cohort average worth comparing against.
    lagging_employees = []
    if total_enrollments > 1:
        for employee_id, employee_name, percentage in enrollee_percentages:
            points_behind = average_percentage - percentage
            if points_behind > LAGGING_THRESHOLD_POINTS:
                lagging_employees.append(
                    LaggingEnrollee(
                        employee_id=employee_id,
                        employee_name=employee_name,
                        completion_percentage=round(percentage, 2),
                        points_behind_average=round(points_behind, 2),
                    )
                )

    return CohortProgressResponse(
        program_id=program.program_id,
        program_name=program.name,
        total_enrollments=total_enrollments,
        completed_enrollments=completed_enrollments,
        average_completion_percentage=average_percentage,
        lagging_employees=lagging_employees,
    )