"""
Leave Management (M2) Business Logic (Services)
===============================================
"""

import holidays
from datetime import datetime, date, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import date
import holidays as pyholidays
from app.modules.attendance.models import AttendanceRecord, AttendanceStatus
from app.modules.calendar.models import Holiday

from app.modules.leave import crud
from app.modules.leave.models import (
    LeaveApplication,
    LeaveAuditLog,
    LeaveType,
    LeaveBalance
)
from app.modules.leave.schemas import (
    LeaveApplicationCreate,
    LeaveTypeCreate,
    LeaveBalanceCreate,
    LeaveStatusUpdate,
    LeaveStatusEnum
)

from app.modules.directory.models import Employee
from app.utils import generate_prefixed_id

# ==========================================
# 1. Leave Type (Rules) Logic
# ==========================================
def create_leave_type(db: Session, leave_type: LeaveTypeCreate):
    new_leave_type = LeaveType(
        name=leave_type.name,
        accrual_method=leave_type.accrual_method,
        carry_forward_limit=leave_type.carry_forward_limit,
        doc_required_threshold=leave_type.doc_required_threshold,
        requires_hr_approval=leave_type.requires_hr_approval
    )
    return crud.create_leave_type(db=db, leave_type=new_leave_type)

def get_leave_types(db: Session):
    return crud.get_leave_types(db)

# ==========================================
# 2. Leave Balance & Auto-Assign Logic
# ==========================================
def create_leave_balance(db: Session, leave_balance: LeaveBalanceCreate):
    employee = crud.get_employee_by_id(db=db, employee_id=leave_balance.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    new_leave_balance = LeaveBalance(
        employee_id=leave_balance.employee_id,
        leave_type_id=leave_balance.leave_type_id,
        year=leave_balance.year,
        balance=leave_balance.balance,
    )
    return crud.create_leave_balance(db=db, leave_balance=new_leave_balance)

def get_leave_balances(db: Session, employee_id: str):
    return crud.get_leave_balances(db=db, employee_id=employee_id)

def auto_assign_leave_balances(db: Session, employee_id: str):
    """
    Automatically creates leave balances for an employee based on gender.
    Checks individually to avoid skipping if partial test data exists.
    """
    employee = crud.get_employee_by_id(db=db, employee_id=employee_id)
    if not employee:
        return False
        
    current_year = datetime.now().year
    crud.initialize_default_leave_types(db)
    
    emp_gender = getattr(employee, "gender", "Male").capitalize()
    
    balances_to_add = [
        {"type": "LT001", "days": 18}, # Earned Leave
        {"type": "LT002", "days": 12}, # Casual Leave
        {"type": "LT003", "days": 12}, # Sick Leave
        {"type": "LT006", "days": 0},  # Comp Off
        {"type": "LT007", "days": 5},  # Bereavement
    ]
    
    if emp_gender == "Female":
        balances_to_add.append({"type": "LT004", "days": 180}) # Maternity Leave
    else:
        balances_to_add.append({"type": "LT005", "days": 15})  # Paternity Leave
        
    # ఒక్కొక్క లీవ్ టైప్ ని విడిగా చెక్ చేసి అసైన్ చేస్తాం
    for bal in balances_to_add:
        existing = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.leave_type_id == bal["type"],
            LeaveBalance.year == current_year
        ).first()
        
        if not existing:
            new_balance = LeaveBalance(
                id=generate_prefixed_id(db, LeaveBalance, "id", "LB"),
                employee_id=employee_id,
                leave_type_id=bal["type"],
                year=current_year,
                balance=bal["days"]
            )
            db.add(new_balance)
            db.commit() # BUG FIX: డూప్లికేట్ ఐడీ రాకుండా ఉండటానికి ఇది లూప్ లోపలే ఉండాలి.
            
    return True

# ==========================================
# 3. Leave Application & Approval Logic
# ==========================================
def create_leave_application(db: Session, application_data: LeaveApplicationCreate):
    employee = crud.get_employee_by_id(db=db, employee_id=application_data.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    overlapping_leave = db.query(LeaveApplication).filter(
        LeaveApplication.employee_id == application_data.employee_id,
        LeaveApplication.status.in_(["PENDING", "PENDING_HR", "APPROVED"]),
        LeaveApplication.start_date <= application_data.end_date,
        LeaveApplication.end_date >= application_data.start_date
    ).first()

    if overlapping_leave:
        raise HTTPException(
            status_code=400, 
            detail="You already have an active leave request applied for these dates."
        )

    new_app = LeaveApplication(
        employee_id=application_data.employee_id,
        leave_type_id=application_data.leave_type_id,
        start_date=application_data.start_date,
        end_date=application_data.end_date,
        status=LeaveStatusEnum.PENDING 
    )
    return crud.create_leave_application(db=db, application=new_app)


def get_leave_applications(db: Session, employee_id: str = None, role: str = None):
    """
    Retrieves leave applications scoped securely by user role and identity.
    Includes Employee details using joinedload to prevent N+1 queries.
    """
    query = db.query(LeaveApplication).options(joinedload(LeaveApplication.employee))
    
    user_role = role.strip() if role else ""
    
    if user_role == "Employee" and employee_id:
        query = query.filter(LeaveApplication.employee_id == employee_id)
        
    elif user_role == "Manager" and employee_id:
        manager_team_employees = db.query(
            Employee.employee_id
        ).filter(
            Employee.manager_id == employee_id
        ).subquery()
        
        query = query.filter(
            LeaveApplication.employee_id.in_(manager_team_employees),
            LeaveApplication.status == LeaveStatusEnum.PENDING
        )
        
    elif user_role == "HR":
        query = query.filter(
            LeaveApplication.status == LeaveStatusEnum.PENDING_HR
        )
        
    return query.all()

def calculate_team_leave_percentage(db: Session, team_id: str) -> float:
    if not team_id:
        return 0.0
    total_members = db.query(Employee).filter(Employee.team_id == team_id).count()
    if total_members == 0:
        return 0.0

    today = date.today()
    employees_on_leave = db.query(LeaveApplication).join(
        Employee,
        LeaveApplication.employee_id == Employee.employee_id
    ).filter(
        Employee.team_id == team_id,
        LeaveApplication.status == LeaveStatusEnum.APPROVED,
        LeaveApplication.start_date <= today,
        LeaveApplication.end_date >= today
    ).count()

    return (employees_on_leave / total_members) * 100.0

def update_leave_status(db: Session, application_id: str, leave_status: LeaveStatusUpdate, force: bool = False):
    application = crud.get_leave_application_by_id(db=db, application_id=application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Leave application not found")
        
    current_status = getattr(application.status, "value", application.status).upper()
    if current_status in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail=f"Application is already {current_status}")

    employee = crud.get_employee_by_id(db=db, employee_id=application.employee_id)
    approver = crud.get_employee_by_id(db=db, employee_id=leave_status.approver_id)
    
    if not approver:
        raise HTTPException(status_code=404, detail="Approver profile not found in system")

    approver_tier = getattr(approver, "access_tier", "")
    allowed_management_tiers = ["Manager", "Admin", "Admin/Leadership", "HR-Restricted"]

    if approver_tier not in allowed_management_tiers:
        raise HTTPException(status_code=403, detail="Access denied. You are not authorized.")
    
    leave_type = db.query(LeaveType).filter(LeaveType.leave_type_id == application.leave_type_id).first()
    
    # Working days calculation logic
    holiday_dates = set()
    try:
        from app.modules.calendar.models import Holiday
        custom_holidays = db.query(Holiday).all()
        for h in custom_holidays:
            if h.date:
                holiday_dates.add(h.date.isoformat() if hasattr(h.date, 'isoformat') else str(h.date))
    except Exception as e:
        print("Calendar Holiday model not accessible, skipping DB holidays.")

    target_year = application.start_date.year
    public_holidays = holidays.country_holidays('IN', years=target_year)
    for p_date in public_holidays.keys():
        holiday_dates.add(str(p_date))

    curr_date = application.start_date
    end_date = application.end_date
    working_days_count = 0

    while curr_date <= end_date:
        is_weekend = curr_date.weekday() >= 5 
        formatted_date = curr_date.isoformat() if hasattr(curr_date, 'isoformat') else str(curr_date)
        is_holiday = formatted_date in holiday_dates

        if not is_weekend and not is_holiday:
            working_days_count += 1
            
        curr_date += timedelta(days=1)

    total_days = working_days_count

    requested_action = getattr(leave_status.status, "value", leave_status.status).upper()
    target_status = requested_action
    is_final_approval = False
    is_admin_override = approver_tier in ["Admin", "Admin/Leadership"]

    if requested_action == "APPROVED":
        if current_status == "PENDING":
            needs_hr = leave_type.requires_hr_approval if leave_type else False
            doc_threshold = leave_type.doc_required_threshold if leave_type else 0
            
            if (needs_hr or (doc_threshold > 0 and total_days > doc_threshold)) and not is_admin_override:
                target_status = "PENDING_HR"
                is_final_approval = False
            else:
                target_status = "APPROVED"
                is_final_approval = True
                
        elif current_status == "PENDING_HR":
            if approver_tier not in ["HR-Restricted", "Admin", "Admin/Leadership"]:
                raise HTTPException(status_code=403, detail="Access denied. Only HR or Admin allowed.")
            target_status = "APPROVED"
            is_final_approval = True
            
    elif requested_action == "REJECTED":
        target_status = "REJECTED"
        is_final_approval = False

    if target_status in ["APPROVED", "PENDING_HR"] and current_status == "PENDING" and not force and not is_admin_override:
        if employee and getattr(employee, 'team_id', None):
            percentage = calculate_team_leave_percentage(db, employee.team_id)
            if percentage >= 30.0:
                return {
                    "approved": False,
                    "status": LeaveStatusEnum.PENDING,
                    "warning": True,
                    "percentage": round(percentage, 2),
                    "message": f"{round(percentage)}% of your team is already on leave. Please review."
                }

    if is_final_approval:
        leave_balance = crud.get_leave_balance(
            db=db,
            employee_id=application.employee_id,
            leave_type_id=application.leave_type_id,
        )
        if not leave_balance:
            raise HTTPException(status_code=404, detail="Leave balance not found")

        if total_days > 0:
            if leave_balance.balance < total_days:
                 raise HTTPException(status_code=400, detail=f"Insufficient leave balance.")
            leave_balance.balance -= total_days
            crud.update_leave_balance(db=db, leave_balance=leave_balance)

    application.status = target_status
    application.approver_id = leave_status.approver_id
    updated_application = crud.update_leave_application(db=db, application=application)

    new_audit = LeaveAuditLog(
        application_id=application.application_id,
        actor_id=leave_status.approver_id,
        action=target_status 
    )
    crud.create_audit_log(db=db, audit_log=new_audit)

    if target_status == "PENDING_HR":
        return {
            "approved": False, "status": LeaveStatusEnum.PENDING_HR, "warning": False,
            "percentage": 0.0, "message": "Approved and forwarded to HR for final verification."
        }
    elif target_status == "APPROVED":
        return {
            "approved": True, "status": LeaveStatusEnum.APPROVED, "warning": False,
            "percentage": 0.0, "message": "Leave request fully approved successfully."
        }
    else:
        return {
            "approved": False, "status": LeaveStatusEnum.REJECTED, "warning": False,
            "percentage": 0.0, "message": "Leave request rejected successfully."
        }


def clean_test_leave_data(db: Session):
    return crud.reset_all_leave_data(db=db)

# ==========================================
# Comp-Off Automation Logic
# ==========================================
def sync_comp_off_balances(db: Session):
    """
    అటెండెన్స్ టేబుల్ ని చెక్ చేసి, వీకెండ్ లేదా హాలిడే రోజు పనిచేసిన వాళ్ళకి Comp-Off క్రెడిట్ చేస్తుంది.
    """
    # 1. ఇంకా Comp-Off ఇవ్వని, ఆఫీస్/WFH చేసిన రికార్డ్స్ తెచ్చుకుంటాం
    uncredited_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.is_comp_off_credited == False,
        AttendanceRecord.status.in_([AttendanceStatus.IN_OFFICE, AttendanceStatus.WFH])
    ).all()

    if not uncredited_records:
        return {"message": "No new weekend/holiday work found to credit."}

    # 2. డేటాబేస్ లో ఉన్న హాలిడేస్ అన్నీ ఒక లిస్ట్ లోకి తెచ్చుకుంటాం
    holidays_db = db.query(Holiday).all()
    holiday_dates = {h.date.isoformat() if hasattr(h.date, 'isoformat') else str(h.date) for h in holidays_db}

    current_year = date.today().year
    
    # 3. పబ్లిక్ హాలిడేస్ కూడా కలుపుతాం
    in_holidays = pyholidays.country_holidays('IN', years=current_year)
    for h_date in in_holidays.keys():
        holiday_dates.add(h_date.isoformat())

    # 4. Comp-Off లీవ్ ఐడీ కనుక్కుంటాం
    comp_off_type = db.query(LeaveType).filter(LeaveType.name.ilike("%comp%")).first()
    if not comp_off_type:
        return {"error": "Comp-Off leave type not found in the system."}

    leave_type_id = comp_off_type.leave_type_id
    comp_offs_added = 0

    # 5. ప్రతి అటెండెన్స్ రికార్డ్ ని చెక్ చేసి బ్యాలెన్స్ ఇస్తాం
    for record in uncredited_records:
        record_date = record.attendance_date
        
        # 5 అంటే Saturday, 6 అంటే Sunday
        is_weekend = record_date.weekday() >= 5 
        formatted_date = record_date.isoformat() if hasattr(record_date, 'isoformat') else str(record_date)
        is_holiday = formatted_date in holiday_dates

        # వాడు వీకెండ్ గానీ, పబ్లిక్ హాలిడే రోజు గానీ పని చేసుంటే..
        if is_weekend or is_holiday:
            # బ్యాలెన్స్ చెక్ చేయడం
            balance_record = db.query(LeaveBalance).filter(
                LeaveBalance.employee_id == record.employee_id,
                LeaveBalance.leave_type_id == leave_type_id,
                LeaveBalance.year == current_year
            ).first()
            
            if not balance_record:
                # బ్యాలెన్స్ అకౌంట్ లేకపోతే కొత్తది క్రియేట్ చేస్తాం
                new_id = f"LB_{record.employee_id}_{leave_type_id}_{current_year}"
                balance_record = LeaveBalance(
                    id=new_id,
                    employee_id=record.employee_id,
                    leave_type_id=leave_type_id,
                    year=current_year,
                    balance=0
                )
                db.add(balance_record)
                db.commit()
                db.refresh(balance_record)

            # అకౌంట్ లో +1 యాడ్ చేస్తాం!
            balance_record.balance += 1

            # మళ్ళీ క్రెడిట్ అవ్వకుండా ఈ రికార్డ్ ని True చేస్తాం
            record.is_comp_off_credited = True
            comp_offs_added += 1

    db.commit()
    return {"message": f"Successfully credited {comp_offs_added} Comp-Off days!"}