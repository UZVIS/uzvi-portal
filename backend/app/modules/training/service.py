import statistics
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.modules.directory.models import Employee
from app.modules.training.models import (
    Enrollment,
    TrainingProgram,
    TrainingUnit,
    UnitCompletion,
)


# ---------- Programs (FR-LMS-01: Admin-only, enforced via router dependency) ----------

def create_program(db: Session, name: str) -> TrainingProgram:
    program = TrainingProgram(name=name)
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


def list_programs(db: Session) -> list[TrainingProgram]:
    return (
        db.query(TrainingProgram)
        .options(joinedload(TrainingProgram.units))
        .order_by(TrainingProgram.program_id)
        .all()
    )


def get_program(db: Session, program_id: int) -> TrainingProgram:
    program = (
        db.query(TrainingProgram)
        .options(joinedload(TrainingProgram.units))
        .filter(TrainingProgram.program_id == program_id)
        .first()
    )
    if program is None:
        raise HTTPException(status_code=404, detail="Training program not found.")
    return program


def delete_program(db: Session, program_id: int) -> None:
    # Guard: don't silently wipe employee progress by deleting a program in use.
    program = get_program(db, program_id)
    if program.enrollments:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a program with active enrollments.",
        )
    db.delete(program)
    db.commit()


# ---------- Units ----------

def create_unit(db: Session, program_id: int, name: str, sequence: int) -> TrainingUnit:
    program = get_program(db, program_id)

    # Not explicitly required by the FRD, but prevents ambiguous ordering.
    duplicate_sequence = (
        db.query(TrainingUnit)
        .filter(
            TrainingUnit.program_id == program_id,
            TrainingUnit.sequence == sequence,
        )
        .first()
    )
    if duplicate_sequence is not None:
        raise HTTPException(
            status_code=400,
            detail=f"Sequence {sequence} is already used by another unit in this program.",
        )

    unit = TrainingUnit(program_id=program.program_id, name=name, sequence=sequence)
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit


def delete_unit(db: Session, unit_id: int) -> None:
    unit = db.get(TrainingUnit, unit_id)
    if unit is None:
        raise HTTPException(status_code=404, detail="Training unit not found.")
    if unit.completions:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a unit that employees have already completed.",
        )
    db.delete(unit)
    db.commit()


def update_unit(
    db: Session,
    unit_id: int,
    name: Optional[str] = None,
    sequence: Optional[int] = None,
) -> TrainingUnit:
    unit = db.get(TrainingUnit, unit_id)
    if unit is None:
        raise HTTPException(status_code=404, detail="Training unit not found.")

    # Same duplicate-sequence guard as create_unit, just excluding this unit's
    # own current row so "no-op" edits (re-saving the same sequence) don't
    # falsely collide with themselves.
    if sequence is not None and sequence != unit.sequence:
        duplicate_sequence = (
            db.query(TrainingUnit)
            .filter(
                TrainingUnit.program_id == unit.program_id,
                TrainingUnit.sequence == sequence,
                TrainingUnit.unit_id != unit_id,
            )
            .first()
        )
        if duplicate_sequence is not None:
            raise HTTPException(
                status_code=400,
                detail=f"Sequence {sequence} is already used by another unit in this program.",
            )
        unit.sequence = sequence

    if name is not None:
        unit.name = name

    db.commit()
    db.refresh(unit)
    return unit


# ---------- Enrollments (FR-LMS-02) ----------

def enroll_employee(
    db: Session,
    program_id: int,
    target_employee_id: str,
    actor: Employee,
    is_admin: bool,
) -> Enrollment:
    # Identity is never trusted from the request body alone: enrolling someone
    # other than yourself requires Admin/Leadership.
    if target_employee_id != actor.employee_id and not is_admin:
        raise HTTPException(
            status_code=403,
            detail="You can only enroll yourself in a training program.",
        )

    program = get_program(db, program_id)

    target_employee = db.get(Employee, target_employee_id)
    if target_employee is None:
        raise HTTPException(status_code=404, detail="Employee not found.")
    if target_employee.employment_status != "active":
        raise HTTPException(
            status_code=400,
            detail="Cannot enroll an employee who is not active.",
        )

    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.employee_id == target_employee_id,
            Enrollment.program_id == program_id,
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="This employee is already enrolled in this program.",
        )

    enrollment = Enrollment(employee_id=target_employee_id, program_id=program.program_id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def enrollment_progress(enrollment: Enrollment) -> tuple[int, int, float]:
    total_units = len(enrollment.program.units)
    completed_units = len(enrollment.completions)
    completion_pct = (completed_units / total_units * 100) if total_units else 0.0
    return total_units, completed_units, completion_pct


def list_enrollments_for_employee(db: Session, employee_id: str) -> list[Enrollment]:
    return (
        db.query(Enrollment)
        .options(
            joinedload(Enrollment.program).joinedload(TrainingProgram.units),
            joinedload(Enrollment.completions),
        )
        .filter(Enrollment.employee_id == employee_id)
        .order_by(Enrollment.enrolled_at.desc())
        .all()
    )


def get_enrollment(db: Session, enrollment_id: int) -> Enrollment:
    enrollment = (
        db.query(Enrollment)
        .options(
            joinedload(Enrollment.program).joinedload(TrainingProgram.units),
            joinedload(Enrollment.completions),
        )
        .filter(Enrollment.enrollment_id == enrollment_id)
        .first()
    )
    if enrollment is None:
        raise HTTPException(status_code=404, detail="Enrollment not found.")
    return enrollment


# ---------- Completions (FR-LMS-02, FR-LMS-04) ----------
# Self-attested only: even Admin/Leadership cannot mark completion on someone
# else's behalf. This matches the module's original design intent.

def complete_unit(
    db: Session,
    enrollment_id: int,
    unit_id: int,
    actor: Employee,
    score: Optional[int],
) -> UnitCompletion:
    enrollment = get_enrollment(db, enrollment_id)

    if enrollment.employee_id != actor.employee_id:
        raise HTTPException(
            status_code=403,
            detail="You can only mark your own training units complete.",
        )

    unit = db.get(TrainingUnit, unit_id)
    if unit is None:
        raise HTTPException(status_code=404, detail="Training unit not found.")

    # Cross-program integrity: stop a client completing a unit from a program
    # they aren't even enrolled in.
    if unit.program_id != enrollment.program_id:
        raise HTTPException(
            status_code=400,
            detail="This unit does not belong to the program you are enrolled in.",
        )

    duplicate = (
        db.query(UnitCompletion)
        .filter(
            UnitCompletion.enrollment_id == enrollment_id,
            UnitCompletion.unit_id == unit_id,
        )
        .first()
    )
    if duplicate is not None:
        raise HTTPException(
            status_code=409,
            detail="This unit has already been marked complete.",
        )

    completion = UnitCompletion(
        enrollment_id=enrollment_id,
        unit_id=unit_id,
        score=score,
    )
    db.add(completion)
    db.commit()
    db.refresh(completion)
    return completion


def delete_completion(db: Session, completion_id: int, actor: Employee) -> None:
    # Lets an employee undo a mistaken self-attestation. Self-only, same as
    # completing in the first place - not even Admin/Leadership may undo
    # someone else's completion. Deleting the row also naturally allows
    # re-completing the same unit afterward, since the duplicate check in
    # complete_unit only looks at rows that still exist.
    completion = db.get(UnitCompletion, completion_id)
    if completion is None:
        raise HTTPException(status_code=404, detail="Completion not found.")

    enrollment = get_enrollment(db, completion.enrollment_id)
    if enrollment.employee_id != actor.employee_id:
        raise HTTPException(
            status_code=403,
            detail="You can only undo your own training completions.",
        )

    db.delete(completion)
    db.commit()


# ---------- Cohort progress (FR-LMS-03 / FR-LMS-05) ----------

def get_cohort_progress(db: Session, program_id: int) -> dict:
    program = get_program(db, program_id)
    total_units = len(program.units)

    enrollments = (
        db.query(Enrollment)
        .options(joinedload(Enrollment.completions))
        .filter(Enrollment.program_id == program_id)
        .all()
    )

    employee_rows = []
    pct_values = []
    for enrollment in enrollments:
        completed_units = len(enrollment.completions)
        completion_pct = (completed_units / total_units * 100) if total_units else 0.0
        pct_values.append(completion_pct)
        employee_rows.append(
            {
                "employee_id": enrollment.employee_id,
                "employee_name": enrollment.employee_name,
                "total_units": total_units,
                "completed_units": completed_units,
                "completion_pct": completion_pct,
            }
        )

    median_pct = statistics.median(pct_values) if pct_values else 0.0

    # No per-program target-duration field exists in the schema, so "falling
    # behind an expected pace" (FR-LMS-05) is judged relative to the cohort's
    # own median rather than an absolute calendar target.
    FALLING_BEHIND_MARGIN = 20.0
    for row in employee_rows:
        row["flagged_behind"] = (median_pct - row["completion_pct"]) > FALLING_BEHIND_MARGIN

    return {
        "program_id": program.program_id,
        "program_name": program.name,
        "total_units": total_units,
        "median_completion_pct": median_pct,
        "employees": employee_rows,
    }
