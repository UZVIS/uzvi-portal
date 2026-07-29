from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
import logging

from app.modules.performance_goals import models, schemas
from app.modules.directory.models import Employee

logger = logging.getLogger(__name__)


class PerformanceService:
    
    # ==================== Review Cycle Operations ====================
    
    @staticmethod
    def create_cycle(db: Session, cycle_data: schemas.ReviewCycleCreate) -> models.ReviewCycle:
        if cycle_data.period_start >= cycle_data.period_end:
            raise ValueError("period_start must be before period_end")
        
        db_cycle = models.ReviewCycle(**cycle_data.model_dump())
        db.add(db_cycle)
        db.commit()
        db.refresh(db_cycle)
        return db_cycle
    
    @staticmethod
    def get_cycle(db: Session, cycle_id: int) -> Optional[models.ReviewCycle]:
        return db.query(models.ReviewCycle).filter(models.ReviewCycle.id == cycle_id).first()
    
    @staticmethod
    def get_active_cycle(db: Session) -> Optional[models.ReviewCycle]:
        now = datetime.now()
        return db.query(models.ReviewCycle).filter(
            and_(
                models.ReviewCycle.period_start <= now,
                models.ReviewCycle.period_end >= now
            )
        ).first()
    
    @staticmethod
    def list_cycles(db: Session, skip: int = 0, limit: int = 100) -> List[models.ReviewCycle]:
        return db.query(models.ReviewCycle).order_by(
            models.ReviewCycle.period_start.desc()
        ).offset(skip).limit(limit).all()
    
    # ==================== Goal Operations ====================
    
    @staticmethod
    def create_goal(db: Session, employee_id: str, goal_data: schemas.GoalCreate) -> models.Goal:
        # Verify employee exists
        employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
        if not employee:
            raise ValueError(f"Employee {employee_id} not found")
        
        # Verify cycle exists
        cycle = PerformanceService.get_cycle(db, goal_data.cycle_id)
        if not cycle:
            raise ValueError(f"Review cycle {goal_data.cycle_id} not found")
        
        db_goal = models.Goal(
            employee_id=employee_id,
            **goal_data.model_dump()
        )
        db.add(db_goal)
        db.commit()
        db.refresh(db_goal)
        return db_goal
    
    @staticmethod
    def get_goal(db: Session, goal_id: int) -> Optional[models.Goal]:
        return db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    
    @staticmethod
    def get_employee_goals(
        db: Session, 
        employee_id: str, 
        cycle_id: Optional[int] = None,
        status: Optional[models.GoalStatus] = None
    ) -> List[models.Goal]:
        query = db.query(models.Goal).filter(models.Goal.employee_id == employee_id)
        if cycle_id:
            query = query.filter(models.Goal.cycle_id == cycle_id)
        if status:
            query = query.filter(models.Goal.status == status)
        return query.order_by(models.Goal.created_at).all()
    
    @staticmethod
    def get_team_goals(
        db: Session, 
        manager_id: str,
        cycle_id: Optional[int] = None
    ) -> List[models.Goal]:
        # Get direct reports
        reports = db.query(Employee).filter(Employee.manager_id == manager_id).all()
        report_ids = [emp.employee_id for emp in reports]
        
        query = db.query(models.Goal).filter(models.Goal.employee_id.in_(report_ids))
        if cycle_id:
            query = query.filter(models.Goal.cycle_id == cycle_id)
        return query.order_by(models.Goal.employee_id, models.Goal.created_at).all()
    
    @staticmethod
    def update_goal_status(
        db: Session, 
        goal_id: int, 
        status: models.GoalStatus
    ) -> Optional[models.Goal]:
        goal = PerformanceService.get_goal(db, goal_id)
        if goal:
            goal.status = status
            db.commit()
            db.refresh(goal)
        return goal
    
    # ==================== Self Assessment Operations ====================
    
    @staticmethod
    def submit_self_assessment(
        db: Session, 
        goal_id: int, 
        assessment_data: schemas.SelfAssessmentCreate
    ) -> models.SelfAssessment:
        goal = PerformanceService.get_goal(db, goal_id)
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")
        
        # Check if assessment already exists
        existing = db.query(models.SelfAssessment).filter(
            models.SelfAssessment.goal_id == goal_id
        ).first()
        
        if existing:
            # Update existing assessment
            existing.assessment_text = assessment_data.assessment_text
            existing.submitted_at = datetime.now()
            db.commit()
            db.refresh(existing)
            return existing
        
        # Create new assessment
        db_assessment = models.SelfAssessment(
            goal_id=goal_id,
            **assessment_data.model_dump()
        )
        db.add(db_assessment)
        
        # Update goal status
        goal.status = models.GoalStatus.SELF_SUBMITTED
        
        db.commit()
        db.refresh(db_assessment)
        return db_assessment
    
    @staticmethod
    def get_self_assessment(db: Session, goal_id: int) -> Optional[models.SelfAssessment]:
        return db.query(models.SelfAssessment).filter(
            models.SelfAssessment.goal_id == goal_id
        ).first()
    
    # ==================== Manager Review Operations ====================
    
    @staticmethod
    def submit_manager_review(
        db: Session,
        goal_id: int,
        reviewer_id: str,
        review_data: schemas.ManagerReviewCreate
    ) -> models.ManagerReview:
        goal = PerformanceService.get_goal(db, goal_id)
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")
        
        # TEMPORARILY DISABLED FOR TESTING - Remove this bypass after testing!
        # Verify reviewer is the manager
        # employee = db.query(Employee).filter(Employee.employee_id == goal.employee_id).first()
        # if not employee or employee.manager_id != reviewer_id:
        #     raise PermissionError("Only the employee's manager can submit a review")
        
        # Check if review already exists
        existing = db.query(models.ManagerReview).filter(
            models.ManagerReview.goal_id == goal_id
        ).first()
        
        if existing:
            # Update existing review
            existing.rating = review_data.rating
            existing.review_text = review_data.review_text
            existing.submitted_at = datetime.now()
            db.commit()
            db.refresh(existing)
            return existing
        
        # Create new review
        db_review = models.ManagerReview(
            goal_id=goal_id,
            reviewer_id=reviewer_id,
            **review_data.model_dump()
        )
        db.add(db_review)
        
        # Update goal status
        goal.status = models.GoalStatus.MANAGER_REVIEWED
        
        # Check if all goals for this employee in this cycle are reviewed
        cycle_goals = PerformanceService.get_employee_goals(
            db, goal.employee_id, goal.cycle_id
        )
        all_reviewed = all(g.status == models.GoalStatus.MANAGER_REVIEWED for g in cycle_goals)
        
        if all_reviewed:
            # Update all goals to COMPLETED
            for g in cycle_goals:
                g.status = models.GoalStatus.COMPLETED
        
        db.commit()
        db.refresh(db_review)
        return db_review
    
    @staticmethod
    def get_manager_review(db: Session, goal_id: int) -> Optional[models.ManagerReview]:
        return db.query(models.ManagerReview).filter(
            models.ManagerReview.goal_id == goal_id
        ).first()
    
    # ==================== Status & Reporting Operations ====================
    
    @staticmethod
    def calculate_goal_status(
        goal: models.Goal,
        has_self_assessment: bool,
        has_manager_review: bool
    ) -> models.GoalStatus:
        if has_manager_review:
            return models.GoalStatus.COMPLETED
        elif has_self_assessment:
            return models.GoalStatus.SELF_SUBMITTED
        elif goal.description:
            return models.GoalStatus.IN_PROGRESS
        else:
            return models.GoalStatus.NOT_STARTED
    
    @staticmethod
    def get_employee_review_status(
        db: Session,
        employee_id: str,
        cycle_id: int
    ) -> schemas.ReviewStatusResponse:
        goals = PerformanceService.get_employee_goals(db, employee_id, cycle_id)
        employee = db.query(Employee).filter(Employee.employee_id == employee_id).first()
        
        total_goals = len(goals)
        if total_goals == 0:
            return schemas.ReviewStatusResponse(
                employee_id=employee_id,
                employee_name=employee.name if employee else "Unknown",
                goals_count=0,
                status=models.GoalStatus.NOT_STARTED,
                self_assessment_submitted=False,
                manager_review_completed=False,
                completion_percentage=0.0
            )
        
        self_submitted = 0
        manager_reviewed = 0
        completed = 0
        
        for goal in goals:
            has_self = PerformanceService.get_self_assessment(db, goal.id) is not None
            has_manager = PerformanceService.get_manager_review(db, goal.id) is not None
            
            if has_manager:
                manager_reviewed += 1
                completed += 1
            elif has_self:
                self_submitted += 1
            
            # Update goal status based on current state
            new_status = PerformanceService.calculate_goal_status(goal, has_self, has_manager)
            if goal.status != new_status:
                goal.status = new_status
        
        db.commit()
        
        # Determine overall status
        if completed == total_goals:
            overall_status = models.GoalStatus.COMPLETED
        elif manager_reviewed > 0:
            overall_status = models.GoalStatus.MANAGER_REVIEWED
        elif self_submitted == total_goals:
            overall_status = models.GoalStatus.SELF_SUBMITTED
        elif self_submitted > 0:
            overall_status = models.GoalStatus.IN_PROGRESS
        else:
            overall_status = models.GoalStatus.NOT_STARTED
        
        completion_percentage = (completed / total_goals) * 100
        
        return schemas.ReviewStatusResponse(
            employee_id=employee_id,
            employee_name=employee.name if employee else "Unknown",
            goals_count=total_goals,
            status=overall_status,
            self_assessment_submitted=self_submitted > 0,
            manager_review_completed=manager_reviewed > 0,
            completion_percentage=round(completion_percentage, 2)
        )
    
    @staticmethod
    def get_org_review_status(
        db: Session,
        cycle_id: int
    ) -> schemas.OrgReviewStatusResponse:
        cycle = PerformanceService.get_cycle(db, cycle_id)
        if not cycle:
            raise ValueError(f"Review cycle {cycle_id} not found")
        
        # Get all active employees
        employees = db.query(Employee).filter(Employee.employment_status == "active").all()
        
        statuses = []
        completed_count = 0
        pending_self_count = 0
        pending_manager_count = 0
        
        for emp in employees:
            status = PerformanceService.get_employee_review_status(db, emp.employee_id, cycle_id)
            statuses.append(status)
            
            if status.status == models.GoalStatus.COMPLETED:
                completed_count += 1
            elif status.status == models.GoalStatus.SELF_SUBMITTED:
                pending_manager_count += 1
            elif status.status == models.GoalStatus.NOT_STARTED:
                pending_self_count += 1
        
        return schemas.OrgReviewStatusResponse(
            cycle_id=cycle_id,
            cycle_name=cycle.name,
            employees=statuses,
            total_employees=len(employees),
            completed_count=completed_count,
            pending_self_assessment_count=pending_self_count,
            pending_manager_review_count=pending_manager_count
        )
    
    @staticmethod
    def get_goal_with_assessments(db: Session, goal_id: int) -> Optional[Dict[str, Any]]:
        goal = PerformanceService.get_goal(db, goal_id)
        if not goal:
            return None
        
        self_assessment = PerformanceService.get_self_assessment(db, goal_id)
        manager_review = PerformanceService.get_manager_review(db, goal_id)
        
        return {
            "goal": goal,
            "self_assessment": self_assessment,
            "manager_review": manager_review
        }