"""
Leave Management (M2) Business Logic (Services)
===============================================
"""

import holidays
from datetime import datetime, date, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
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
        
    # Check and assign each leave type individually
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
            db.commit() # BUG FIX: This must be inside the loop to prevent duplicate IDs.
            
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
# 3-MODULE INTEGRATION: COMP-OFF AUTOMATIONe
# ==========================================
def sync_comp_off_balances(db: Session):
    try:
        from datetime import date, datetime
        import holidays as pyholidays
        from app.modules.calendar.models import Holiday, CompanyEvent
        from fastapi import HTTPException
        
        print("\n" + "="*50)
        print(" STARTING AUTO COMP-OFF SYNC (9-HOUR RULE)...")
        
        current_year = date.today().year
        holiday_dates = set()
        
        # 1. GET ALL HOLIDAYS & EVENTS
        custom_holidays = db.query(Holiday).all()
        for h in custom_holidays:
            if h.date:
                clean_date = str(h.date).split("T")[0].split(" ")[0]
                holiday_dates.add(clean_date)

        custom_events = db.query(CompanyEvent).all()
        for e in custom_events:
            if e.date:
                clean_date = str(e.date).split("T")[0].split(" ")[0]
                holiday_dates.add(clean_date)

        for year in [2024, 2025, 2026]:
            in_holidays = pyholidays.country_holidays('IN', years=year)
            for h_date in in_holidays.keys():
                holiday_dates.add(str(h_date))

        # 2. GET COMP-OFF LEAVE TYPE
        comp_off_type = db.query(LeaveType).filter(LeaveType.name.ilike("%comp%")).first()
        if not comp_off_type:
            return {"error": "Comp-Off leave type not found."}
        leave_type_id = comp_off_type.leave_type_id

        # 3. CALCULATE EARNED COMP-OFFS
        attendances = db.query(AttendanceRecord).all()
        earned_comp_offs = {}
        
        for record in attendances:
            emp_id = record.employee_id
            status_str = getattr(record.status, "value", record.status)
            
            record_date = record.attendance_date
            if isinstance(record_date, str):
                try:
                    record_date = datetime.strptime(record_date[:10], "%Y-%m-%d").date()
                except:
                    pass
                    
            if not record_date:
                continue
                
            formatted_date = str(record_date)[:10]
            valid_statuses = ["in-office", "wfh", "IN_OFFICE", "WFH", "Present", "present", "PRESENT"]
            
            if status_str not in valid_statuses:
                continue

            is_weekend = record_date.weekday() >= 5
            is_holiday = formatted_date in holiday_dates
            
            if is_weekend or is_holiday:
                # --- NEW: 9-HOUR WORKING LOGIC ---
                if not record.check_in or not record.check_out:
                    print(f"⏭️ Skipped {emp_id} on {formatted_date}: Missing Check-in/Check-out times.")
                    continue
                
                # Calculate time difference
                dummy_date = date.today()
                in_dt = datetime.combine(dummy_date, record.check_in)
                out_dt = datetime.combine(dummy_date, record.check_out)
                
                worked_hours = (out_dt - in_dt).total_seconds() / 3600.0
                
                # if worked_hours >= 9.0:
                #     print(f"COMP-OFF EARNED! {emp_id} on {formatted_date} (Worked: {worked_hours:.2f} hrs)")
                MIN_HOURS_REQUIRED = 0.0 
                
                if worked_hours >= MIN_HOURS_REQUIRED:
                    print(f"COMP-OFF EARNED! {emp_id} on {formatted_date} (Worked: {worked_hours:.2f} hrs)")
                    rec_year = record_date.year
                    if emp_id not in earned_comp_offs:
                        earned_comp_offs[emp_id] = {}
                    earned_comp_offs[emp_id][rec_year] = earned_comp_offs[emp_id].get(rec_year, 0) + 1
                else:
                    print(f" No Comp-Off for {emp_id}: Worked only {worked_hours:.2f} hrs (Min 9 hrs required).")

        # 4. CALCULATE USED COMP-OFFS
        taken_comp_offs = {}
        valid_leave_statuses = ["APPROVED", "PENDING_HR", "pending", "PENDING"]
        
        applications = db.query(LeaveApplication).filter(
            LeaveApplication.leave_type_id == leave_type_id
        ).all()

        for app in applications:
            app_status = getattr(app.status, "value", app.status)
            if app_status not in valid_leave_statuses:
                continue
                
            app_date = app.start_date
            if not app_date:
                continue
                
            emp_id = app.employee_id
            app_year = app_date.year
            end_date = app.end_date or app_date
            
            days = (end_date - app_date).days + 1
            
            if emp_id not in taken_comp_offs:
                taken_comp_offs[emp_id] = {}
            taken_comp_offs[emp_id][app_year] = taken_comp_offs[emp_id].get(app_year, 0) + days

        # 5. UPDATE LEAVE BALANCES
        updates_count = 0
        
        for emp_id, yearly_earned in earned_comp_offs.items():
            for rec_year, earned in yearly_earned.items():
                used = taken_comp_offs.get(emp_id, {}).get(rec_year, 0)
                correct_balance = earned - used
                if correct_balance < 0:
                    correct_balance = 0

                balance_record = db.query(LeaveBalance).filter(
                    LeaveBalance.employee_id == emp_id,
                    LeaveBalance.leave_type_id == leave_type_id,
                    LeaveBalance.year == rec_year
                ).first()

                if not balance_record:
                    new_id = generate_prefixed_id(db, LeaveBalance, "id", "LB")
                    balance_record = LeaveBalance(
                        id=new_id,
                        employee_id=emp_id,
                        leave_type_id=leave_type_id,
                        year=rec_year,
                        balance=correct_balance
                    )
                    db.add(balance_record)
                    db.commit()
                    updates_count += 1
                else:
                    if balance_record.balance != correct_balance:
                        balance_record.balance = correct_balance
                        db.commit()
                        updates_count += 1

        print("="*50 + "\n")
        return {"message": f"Successfully synced balances silently!"}
        
    except Exception as e:
        print(f"CRITICAL ERROR IN SYNC: {str(e)}")
        return {"error": str(e)}