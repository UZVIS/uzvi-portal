from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.performance_goals import schemas, service
from app.modules.performance_goals.dependencies import (
    get_current_user,
    require_admin,
    require_manager,
    require_self_or_manager,
)
from app.modules.directory.models import Employee


router = APIRouter(
    prefix="/performance",
    tags=["Performance & Goals"]
)


# ==================== Review Cycle Endpoints ====================

@router.post(
    "/cycles",
    response_model=schemas.ReviewCycleResponse,
    status_code=status.HTTP_201_CREATED
)
def create_review_cycle(
    cycle_data: schemas.ReviewCycleCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_admin)
):
    try:
        return service.PerformanceService.create_cycle(
            db,
            cycle_data
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/cycles",
    response_model=List[schemas.ReviewCycleResponse]
)
def list_review_cycles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    return service.PerformanceService.list_cycles(
        db,
        skip,
        limit
    )


@router.get(
    "/cycles/active",
    response_model=Optional[schemas.ReviewCycleResponse]
)
def get_active_review_cycle(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    return service.PerformanceService.get_active_cycle(
        db
    )


# ==================== Goal Endpoints ====================

@router.post(
    "/goals",
    response_model=schemas.GoalResponse,
    status_code=status.HTTP_201_CREATED
)
def create_goal(
    goal_data: schemas.GoalCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    try:
        return service.PerformanceService.create_goal(
            db,
            current_user.employee_id,
            goal_data
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.get(
    "/goals/me",
    response_model=List[schemas.GoalResponse]
)
def get_my_goals(
    cycle_id: Optional[int] = Query(None),
    status: Optional[schemas.GoalStatusEnum] = Query(None),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    return service.PerformanceService.get_employee_goals(
        db,
        current_user.employee_id,
        cycle_id,
        status
    )


@router.get(
    "/goals/employee/{employee_id}",
    response_model=List[schemas.GoalResponse]
)
def get_employee_goals(
    employee_id: str,
    cycle_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_self_or_manager)
):
    return service.PerformanceService.get_employee_goals(
        db,
        employee_id,
        cycle_id
    )


@router.get(
    "/goals/{goal_id}",
    response_model=schemas.GoalWithAssessmentsResponse
)
def get_goal_with_assessments(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    goal_data = service.PerformanceService.get_goal_with_assessments(
        db,
        goal_id
    )

    if not goal_data:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    # The service may return either:
    # 1. Nested structure:
    #    {
    #        "goal": goal,
    #        "self_assessment": ...,
    #        "manager_review": ...
    #    }
    #
    # 2. Flattened structure:
    #    {
    #        "id": ...,
    #        "employee_id": ...,
    #        ...
    #    }
    #
    # Normalize both into the response structure expected
    # by GoalWithAssessmentsResponse.

    if "goal" in goal_data:
        goal = goal_data["goal"]

        response_data = {
            "id": goal.id,
            "employee_id": goal.employee_id,
            "cycle_id": goal.cycle_id,
            "description": goal.description,
            "target_outcome": goal.target_outcome,
            "status": goal.status,
            "created_at": goal.created_at,
            "updated_at": goal.updated_at,
            "self_assessment": goal_data.get("self_assessment"),
            "manager_review": goal_data.get("manager_review"),
        }

    else:
        response_data = goal_data

    require_self_or_manager(
        response_data["employee_id"],
        current_user
    )

    return response_data


# ==================== Self Assessment Endpoints ====================

@router.post(
    "/goals/{goal_id}/self-assessment",
    response_model=schemas.SelfAssessmentResponse,
    status_code=status.HTTP_201_CREATED
)
def submit_self_assessment(
    goal_id: int,
    assessment_data: schemas.SelfAssessmentCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    goal = service.PerformanceService.get_goal(
        db,
        goal_id
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    if goal.employee_id != current_user.employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the goal owner can submit self-assessment"
        )

    try:
        return service.PerformanceService.submit_self_assessment(
            db,
            goal_id,
            assessment_data
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# ==================== Manager Review Endpoints ====================

@router.post(
    "/goals/{goal_id}/manager-review",
    response_model=schemas.ManagerReviewResponse,
    status_code=status.HTTP_201_CREATED
)
def submit_manager_review(
    goal_id: int,
    review_data: schemas.ManagerReviewCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_manager)
):
    goal = service.PerformanceService.get_goal(
        db,
        goal_id
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    try:
        return service.PerformanceService.submit_manager_review(
            db,
            goal_id,
            current_user.employee_id,
            review_data
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get(
    "/goals/{goal_id}/manager-review",
    response_model=Optional[schemas.ManagerReviewResponse]
)
def get_manager_review(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    goal = service.PerformanceService.get_goal(
        db,
        goal_id
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    require_self_or_manager(
        goal.employee_id,
        current_user
    )

    return service.PerformanceService.get_manager_review(
        db,
        goal_id
    )


# ==================== Team & Org Views ====================

@router.get(
    "/team",
    response_model=List[schemas.GoalResponse]
)
def get_team_goals(
    cycle_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_manager)
):
    return service.PerformanceService.get_team_goals(
        db,
        current_user.employee_id,
        cycle_id
    )


@router.get(
    "/status/me",
    response_model=schemas.ReviewStatusResponse
)
def get_my_review_status(
    cycle_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    return service.PerformanceService.get_employee_review_status(
        db,
        current_user.employee_id,
        cycle_id
    )


@router.get(
    "/status/employee/{employee_id}",
    response_model=schemas.ReviewStatusResponse
)
def get_employee_review_status(
    employee_id: str,
    cycle_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_self_or_manager)
):
    return service.PerformanceService.get_employee_review_status(
        db,
        employee_id,
        cycle_id
    )


@router.get(
    "/status/org",
    response_model=schemas.OrgReviewStatusResponse
)
def get_org_review_status(
    cycle_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(require_admin)
):
    try:
        return service.PerformanceService.get_org_review_status(
            db,
            cycle_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )


@router.get(
    "/history",
    response_model=List[schemas.GoalResponse]
)
def get_my_historical_goals(
    cycle_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    return service.PerformanceService.get_employee_goals(
        db,
        current_user.employee_id,
        cycle_id
    )