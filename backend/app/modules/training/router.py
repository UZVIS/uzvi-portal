from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.directory.models import Employee
from app.modules.training import schemas, service
from app.modules.training.dependencies import (
    ADMIN_TIERS,
    get_current_employee,
    require_admin,
    require_cohort_viewer,
)

router = APIRouter(prefix="/api/v1/training", tags=["training"])


# ---------- Programs ----------

@router.post("/programs", response_model=schemas.TrainingProgramOut)
def create_program(
    payload: schemas.TrainingProgramCreate,
    db: Session = Depends(get_db),
    _: Employee = Depends(require_admin),
):
    return service.create_program(db, payload.name)


@router.get("/programs", response_model=list[schemas.TrainingProgramOut])
def list_programs(
    db: Session = Depends(get_db),
    _: Employee = Depends(get_current_employee),
):
    return service.list_programs(db)


@router.get("/programs/{program_id}", response_model=schemas.TrainingProgramOut)
def get_program(
    program_id: int,
    db: Session = Depends(get_db),
    _: Employee = Depends(get_current_employee),
):
    return service.get_program(db, program_id)


@router.delete("/programs/{program_id}", status_code=204)
def delete_program(
    program_id: int,
    db: Session = Depends(get_db),
    _: Employee = Depends(require_admin),
):
    service.delete_program(db, program_id)


@router.post("/programs/{program_id}/units", response_model=schemas.TrainingUnitOut)
def create_unit(
    program_id: int,
    payload: schemas.TrainingUnitCreate,
    db: Session = Depends(get_db),
    _: Employee = Depends(require_admin),
):
    return service.create_unit(db, program_id, payload.name, payload.sequence)


@router.delete("/units/{unit_id}", status_code=204)
def delete_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    _: Employee = Depends(require_admin),
):
    service.delete_unit(db, unit_id)


@router.patch("/units/{unit_id}", response_model=schemas.TrainingUnitOut)
def update_unit(
    unit_id: int,
    payload: schemas.TrainingUnitUpdate,
    db: Session = Depends(get_db),
    _: Employee = Depends(require_admin),
):
    return service.update_unit(db, unit_id, payload.name, payload.sequence)


# ---------- Enrollments ----------
# NOTE: specific paths ("/enrollments/me", "/enrollments/by-employee/{id}") are
# registered BEFORE the generic "/enrollments/{enrollment_id}" wildcard, per the
# route-ordering rule already learned in another module tonight.

def _to_enrollment_out(enrollment) -> schemas.EnrollmentOut:
    total_units, completed_units, completion_pct = service.enrollment_progress(enrollment)
    return schemas.EnrollmentOut(
        enrollment_id=enrollment.enrollment_id,
        employee_id=enrollment.employee_id,
        employee_name=enrollment.employee_name,
        program_id=enrollment.program_id,
        enrolled_at=enrollment.enrolled_at,
        total_units=total_units,
        completed_units=completed_units,
        completion_pct=completion_pct,
        completions=enrollment.completions,
    )


@router.post("/enrollments", response_model=schemas.EnrollmentOut)
def create_enrollment(
    payload: schemas.EnrollmentCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    target_employee_id = payload.employee_id or current_employee.employee_id
    is_admin = current_employee.access_tier in ADMIN_TIERS
    enrollment = service.enroll_employee(
        db, payload.program_id, target_employee_id, current_employee, is_admin
    )
    return _to_enrollment_out(enrollment)


@router.get("/enrollments/me", response_model=list[schemas.EnrollmentOut])
def list_my_enrollments(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    enrollments = service.list_enrollments_for_employee(db, current_employee.employee_id)
    return [_to_enrollment_out(e) for e in enrollments]


@router.get("/enrollments/by-employee/{employee_id}", response_model=list[schemas.EnrollmentOut])
def list_enrollments_by_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    # COHORT_VIEW_TIERS already includes Admin/Leadership, so this single check
    # covers self-access plus every privileged tier.
    if employee_id != current_employee.employee_id:
        require_cohort_viewer(current_employee)
    enrollments = service.list_enrollments_for_employee(db, employee_id)
    return [_to_enrollment_out(e) for e in enrollments]


@router.get("/enrollments/{enrollment_id}", response_model=schemas.EnrollmentOut)
def get_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    enrollment = service.get_enrollment(db, enrollment_id)
    if enrollment.employee_id != current_employee.employee_id:
        require_cohort_viewer(current_employee)
    return _to_enrollment_out(enrollment)


@router.post(
    "/enrollments/{enrollment_id}/units/{unit_id}/complete",
    response_model=schemas.UnitCompletionOut,
)
def complete_unit(
    enrollment_id: int,
    unit_id: int,
    payload: schemas.UnitCompletionCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    return service.complete_unit(db, enrollment_id, unit_id, current_employee, payload.score)


@router.delete("/completions/{completion_id}", status_code=204)
def delete_completion(
    completion_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    service.delete_completion(db, completion_id, current_employee)


@router.get("/programs/{program_id}/cohort-progress", response_model=schemas.CohortProgressOut)
def get_cohort_progress(
    program_id: int,
    db: Session = Depends(get_db),
    _: Employee = Depends(require_cohort_viewer),
):
    return service.get_cohort_progress(db, program_id)
