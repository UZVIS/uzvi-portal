


import os
import uuid
from typing import List, Optional
from collections import defaultdict
from datetime import date, datetime, timezone, timedelta

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.modules.expense_claims import models, schemas
from app.modules.directory.models import Employee

ADMIN_APPROVAL_THRESHOLD = 25000.0


# IST timezone
IST = timezone(timedelta(hours=5, minutes=30))

VALID_TRANSITIONS = {

    "Submitted": {
        "Approved",
        "Manager Approved",
        "Rejected",
    },


    "Manager Approved": {
        "Approved",
        "Rejected",
    },

    # Final approved claim
    "Approved": {
        "Reimbursed",
    },

    "Rejected": set(),

    "Reimbursed": set(),
}


RECEIPT_STORAGE_DIR = os.path.join(
    os.path.dirname(__file__),
    "receipt_uploads",
)

os.makedirs(
    RECEIPT_STORAGE_DIR,
    exist_ok=True,
)


class NotFoundError(Exception):
    pass


class InvalidTransitionError(Exception):
    pass


class CapExceededError(Exception):
    pass


class FutureDateError(Exception):
    pass


class InvalidReceiptError(Exception):
    pass


def create_category(
    db: Session,
    data: schemas.ExpenseCategoryCreate,
) -> models.ExpenseCategory:

    category_name = data.name.strip()

    if not category_name:
        raise ValueError(
            "Category name cannot be empty."
        )

    existing_category = (
        db.query(models.ExpenseCategory)
        .filter(
            models.ExpenseCategory.name.ilike(
                category_name
            )
        )
        .first()
    )

    if existing_category:
        raise ValueError(
            f"Category '{category_name}' already exists."
        )

    category_data = data.model_dump()

    category_data["name"] = category_name

    category = models.ExpenseCategory(
        **category_data
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return category


def list_categories(
    db: Session,
) -> List[models.ExpenseCategory]:

    return (
        db.query(models.ExpenseCategory)
        .order_by(
            models.ExpenseCategory.name
        )
        .all()
    )


def get_category(
    db: Session,
    category_id: str,
) -> models.ExpenseCategory:

    category = db.get(
        models.ExpenseCategory,
        category_id,
    )

    if category is None:
        raise NotFoundError(
            f"Category {category_id} not found"
        )

    return category


def create_claim(
    db: Session,
    data: schemas.ExpenseClaimCreate,
) -> models.ExpenseClaim:

    category = get_category(
        db,
        data.category_id,
    )


    if (
        category.cap_amount is not None
        and data.amount > category.cap_amount
    ):
        raise CapExceededError(
            f"Amount {data.amount} exceeds cap "
            f"{category.cap_amount} for category "
            f"{category.category_id}"
        )


    if category.cap_amount is not None:

        month_start = data.date.replace(
            day=1
        )

        if data.date.month == 12:

            next_month_start = data.date.replace(
                year=data.date.year + 1,
                month=1,
                day=1,
            )

        else:

            next_month_start = data.date.replace(
                month=data.date.month + 1,
                day=1,
            )

        existing_this_month = (
            db.query(models.ExpenseClaim)
            .filter(
                models.ExpenseClaim.employee_id
                == data.employee_id,

                models.ExpenseClaim.category_id
                == data.category_id,

                models.ExpenseClaim.status
                != "Rejected",

                models.ExpenseClaim.date
                >= month_start,

                models.ExpenseClaim.date
                < next_month_start,
            )
            .all()
        )

        month_total_so_far = sum(
            c.amount
            for c in existing_this_month
        )

        if (
            month_total_so_far + data.amount
            > category.cap_amount
        ):
            raise CapExceededError(
                f"This claim would bring your "
                f"{category.name} total for "
                f"{month_start.strftime('%B %Y')} to "
                f"{month_total_so_far + data.amount}, "
                f"exceeding the monthly cap of "
                f"{category.cap_amount}. "
                f"Already claimed this month: "
                f"{month_total_so_far}."
            )



    if data.date > date.today():

        raise FutureDateError(
            f"Cannot submit a claim dated {data.date} "
            f"- it's in the future. "
            f"Use today's date or an earlier date."
        )



    claim = models.ExpenseClaim(
        claim_id=data.claim_id,
        employee_id=data.employee_id,
        category_id=data.category_id,
        project_id=data.project_id,
        amount=data.amount,
        date=data.date,

        # Every new claim starts here
        status="Submitted",

        description=data.description,
        receipt_file_path=None,
    )

    db.add(claim)
    db.commit()
    db.refresh(claim)

    return claim


def upload_receipt(
    db: Session,
    claim_id: str,
    file: UploadFile,
) -> models.ExpenseClaim:

    claim = get_claim(
        db,
        claim_id,
    )

    ext = os.path.splitext(
        file.filename or ""
    )[1].lower()

    if ext not in schemas.ALLOWED_RECEIPT_EXTENSIONS:

        raise InvalidReceiptError(
            f"Unsupported file type '{ext}'. "
            f"Allowed: "
            f"{', '.join(schemas.ALLOWED_RECEIPT_EXTENSIONS)}"
        )

    contents = file.file.read()

    if (
        len(contents)
        > schemas.MAX_RECEIPT_SIZE_BYTES
    ):
        raise InvalidReceiptError(
            "Receipt file exceeds 5MB limit"
        )

    stored_filename = (
        f"{claim_id}_{uuid.uuid4().hex}{ext}"
    )

    stored_path = os.path.join(
        RECEIPT_STORAGE_DIR,
        stored_filename,
    )

    with open(
        stored_path,
        "wb",
    ) as f:
        f.write(contents)

    claim.receipt_file_path = (
        f"receipt_uploads/{stored_filename}"
    )

    db.commit()
    db.refresh(claim)

    return claim


def get_claim(
    db: Session,
    claim_id: str,
) -> models.ExpenseClaim:

    claim = db.get(
        models.ExpenseClaim,
        claim_id,
    )

    if claim is None:
        raise NotFoundError(
            f"Claim {claim_id} not found"
        )

    return claim



def _add_display_names(
    db: Session,
    claims: List[models.ExpenseClaim],
) -> List[models.ExpenseClaim]:
    

    return claims


def list_claims(
    db: Session,
    employee_id: Optional[str] = None,
    current_employee: Optional[Employee] = None,
) -> List[models.ExpenseClaim]:


    if current_employee is None:

        query = db.query(
            models.ExpenseClaim
        )

        if employee_id:

            query = query.filter(
                models.ExpenseClaim.employee_id
                == employee_id
            )

        claims = (
            query
            .order_by(
                models.ExpenseClaim.date.desc(),
                models.ExpenseClaim.claim_id.desc(),
            )
            .all()
        )

        return _add_display_names(
            db,
            claims,
        )


    if employee_id is not None:



        if (
            employee_id
            != current_employee.employee_id
        ):
            return []

        claims = (
            db.query(models.ExpenseClaim)
            .filter(
                models.ExpenseClaim.employee_id
                == current_employee.employee_id
            )
            .order_by(
                models.ExpenseClaim.date.desc(),
                models.ExpenseClaim.claim_id.desc(),
            )
            .all()
        )

        return _add_display_names(
            db,
            claims,
        )


    if (
        current_employee.access_tier
        == "HR-Restricted"
    ):

        # HR can view claims but cannot act on them.
        claims = (
            db.query(models.ExpenseClaim)
            .order_by(
                models.ExpenseClaim.date.desc(),
                models.ExpenseClaim.claim_id.desc(),
            )
            .all()
        )

        return _add_display_names(
            db,
            claims,
        )


    if (
        current_employee.access_tier
        == "Admin/Leadership"
    ):

        claims_by_id = {}


        direct_report_claims = (
            db.query(models.ExpenseClaim)
            .join(
                Employee,
                models.ExpenseClaim.employee_id
                == Employee.employee_id,
            )
            .filter(
                Employee.manager_id
                == current_employee.employee_id,

                models.ExpenseClaim.status
                == "Submitted",
            )
            .all()
        )

        for claim in direct_report_claims:
            claims_by_id[
                claim.claim_id
            ] = claim

        admin_second_stage_claims = (
            db.query(models.ExpenseClaim)
            .filter(
                models.ExpenseClaim.amount
                > ADMIN_APPROVAL_THRESHOLD,

                models.ExpenseClaim.status
                == "Manager Approved",
            )
            .all()
        )

        for claim in admin_second_stage_claims:
            claims_by_id[
                claim.claim_id
            ] = claim


        decided_claims = (
            db.query(models.ExpenseClaim)
            .filter(
                models.ExpenseClaim.decided_by
                == current_employee.employee_id
            )
            .all()
        )

        for claim in decided_claims:
            claims_by_id[
                claim.claim_id
            ] = claim

        claims = sorted(
            claims_by_id.values(),
            key=lambda claim: (
                claim.date,
                claim.claim_id,
            ),
            reverse=True,
        )

        return _add_display_names(
            db,
            claims,
        )


    if (
        current_employee.access_tier
        == "Manager"
    ):

        claims_by_id = {}


        submitted_claims = (
            db.query(models.ExpenseClaim)
            .join(
                Employee,
                models.ExpenseClaim.employee_id
                == Employee.employee_id,
            )
            .filter(
                Employee.manager_id
                == current_employee.employee_id,

                models.ExpenseClaim.status
                == "Submitted",
            )
            .all()
        )

        for claim in submitted_claims:
            claims_by_id[
                claim.claim_id
            ] = claim


        decided_claims = (
            db.query(models.ExpenseClaim)
            .filter(
                models.ExpenseClaim.decided_by
                == current_employee.employee_id
            )
            .all()
        )

        for claim in decided_claims:
            claims_by_id[
                claim.claim_id
            ] = claim

        claims = sorted(
            claims_by_id.values(),
            key=lambda claim: (
                claim.date,
                claim.claim_id,
            ),
            reverse=True,
        )

        return _add_display_names(
            db,
            claims,
        )


    claims = (
        db.query(models.ExpenseClaim)
        .filter(
            models.ExpenseClaim.employee_id
            == current_employee.employee_id
        )
        .order_by(
            models.ExpenseClaim.date.desc(),
            models.ExpenseClaim.claim_id.desc(),
        )
        .all()
    )

    return _add_display_names(
        db,
        claims,
    )


def _assert_can_decide(
    db: Session,
    claim: models.ExpenseClaim,
    deciding_employee: Employee,
) -> None:


    claim_employee = db.get(
        Employee,
        claim.employee_id,
    )

    if claim_employee is None:
        raise PermissionError(
            f"Employee {claim.employee_id} "
            f"does not exist."
        )

    if (
        deciding_employee.access_tier
        == "HR-Restricted"
    ):
        raise PermissionError(
            "HR-Restricted employees cannot "
            "approve or reject expense claims."
        )


    if (
        claim.amount
        <= ADMIN_APPROVAL_THRESHOLD
    ):


        if (
            deciding_employee.access_tier
            not in (
                "Manager",
                "Admin/Leadership",
            )
        ):
            raise PermissionError(
                "Claims up to ₹25,000 must be "
                "approved by the employee's "
                "direct reporting manager."
            )


        if (
            claim_employee.manager_id
            != deciding_employee.employee_id
        ):

            manager_id = (
                claim_employee.manager_id
            )

            if manager_id:

                manager = db.get(
                    Employee,
                    manager_id,
                )

                manager_name = (
                    manager.name
                    if manager is not None
                    else manager_id
                )

                raise PermissionError(
                    f"This claim must be approved "
                    f"by the reporting manager "
                    f"{manager_name} "
                    f"({manager_id})."
                )

            raise PermissionError(
                "This employee does not have "
                "a reporting manager."
            )

        return


    if claim.status == "Submitted":


        if (
            deciding_employee.access_tier
            not in (
                "Manager",
                "Admin/Leadership",
            )
        ):
            raise PermissionError(
                "This claim must first be "
                "approved by the employee's direct "
                "reporting manager."
            )


        if (
            claim_employee.manager_id
            != deciding_employee.employee_id
        ):

            manager_id = (
                claim_employee.manager_id
            )

            if manager_id:

                manager = db.get(
                    Employee,
                    manager_id,
                )

                manager_name = (
                    manager.name
                    if manager is not None
                    else manager_id
                )

                raise PermissionError(
                    f"This claim must first be "
                    f"approved by the reporting "
                    f"manager {manager_name} "
                    f"({manager_id})."
                )

            raise PermissionError(
                "This employee does not have "
                "a reporting manager."
            )

        return


    if claim.status == "Manager Approved":

        if (
            deciding_employee.access_tier
            != "Admin/Leadership"
        ):
            raise PermissionError(
                "This claim has already been "
                "approved by the manager and "
                "now requires Admin/Leadership "
                "approval."
            )

        return


    raise PermissionError(
        f"Claim {claim.claim_id} is not "
        f"waiting for approval."
    )


def _transition(
    db: Session,
    claim_id: str,
    new_status: str,
    decided_by_role: Optional[str] = None,
    decided_by_employee_id: Optional[str] = None,
) -> models.ExpenseClaim:

    claim = get_claim(
        db,
        claim_id,
    )

    allowed_statuses = (
        VALID_TRANSITIONS.get(
            claim.status,
            set(),
        )
    )

    if new_status not in allowed_statuses:

        raise InvalidTransitionError(
            f"Cannot move claim from "
            f"{claim.status} to {new_status}"
        )

    claim.status = new_status


    if new_status in (
        "Manager Approved",
        "Approved",
        "Rejected",
    ):

        claim.decided_by_role = (
            decided_by_role
        )

        claim.decided_by = (
            decided_by_employee_id
        )

        claim.decided_at = datetime.now(
            IST
        )

    db.commit()
    db.refresh(claim)

    return claim


def approve_claim(
    db: Session,
    claim_id: str,
    decided_by_role: str,
    decided_by_employee_id: Optional[str] = None,
) -> models.ExpenseClaim:

    claim = get_claim(
        db,
        claim_id,
    )

    if decided_by_employee_id is None:
        raise PermissionError(
            "The approving employee could "
            "not be identified."
        )

    deciding_employee = db.get(
        Employee,
        decided_by_employee_id,
    )

    if deciding_employee is None:
        raise PermissionError(
            "The approving employee does "
            "not exist."
        )

    _assert_can_decide(
        db,
        claim,
        deciding_employee,
    )


    if (
        decided_by_role
        != deciding_employee.access_tier
    ):
        raise PermissionError(
            "Approver role does not match "
            "the logged-in employee."
        )


    if (
        claim.amount
        <= ADMIN_APPROVAL_THRESHOLD
    ):

        return _transition(
            db,
            claim_id,
            "Approved",
            deciding_employee.access_tier,
            deciding_employee.employee_id,
        )


    if claim.status == "Submitted":


        claim_employee = db.get(
            Employee,
            claim.employee_id,
        )

        if (
            claim_employee is not None
            and claim_employee.manager_id
            == deciding_employee.employee_id
            and deciding_employee.access_tier
            == "Admin/Leadership"
        ):
            return _transition(
                db,
                claim_id,
                "Approved",
                deciding_employee.access_tier,
                deciding_employee.employee_id,
            )


        return _transition(
            db,
            claim_id,
            "Manager Approved",
            deciding_employee.access_tier,
            deciding_employee.employee_id,
        )


    if claim.status == "Manager Approved":

        return _transition(
            db,
            claim_id,
            "Approved",
            deciding_employee.access_tier,
            deciding_employee.employee_id,
        )

    raise InvalidTransitionError(
        f"Cannot approve claim in status "
        f"{claim.status}"
    )


def reject_claim(
    db: Session,
    claim_id: str,
    decided_by_role: str,
    decided_by_employee_id: Optional[str] = None,
) -> models.ExpenseClaim:

    claim = get_claim(
        db,
        claim_id,
    )

    if decided_by_employee_id is None:

        raise PermissionError(
            "The rejecting employee could "
            "not be identified."
        )

    deciding_employee = db.get(
        Employee,
        decided_by_employee_id,
    )

    if deciding_employee is None:

        raise PermissionError(
            "The rejecting employee does "
            "not exist."
        )


    _assert_can_decide(
        db,
        claim,
        deciding_employee,
    )


    if (
        decided_by_role
        != deciding_employee.access_tier
    ):

        raise PermissionError(
            "Approver role does not match "
            "the logged-in employee."
        )

   

    return _transition(
        db,
        claim_id,
        "Rejected",
        deciding_employee.access_tier,
        deciding_employee.employee_id,
    )


def mark_reimbursed(
    db: Session,
    claim_id: str,
) -> models.ExpenseClaim:

    return _transition(
        db,
        claim_id,
        "Reimbursed",
    )


def pending_reimbursement_total(
    db: Session,
    employee_id: str,
) -> schemas.PendingTotal:

    claims = (
        db.query(models.ExpenseClaim)
        .filter(
            models.ExpenseClaim.employee_id
            == employee_id
        )
        .all()
    )

    pending = [
        c
        for c in claims
        if c.status in (
            "Submitted",
            "Manager Approved",
            "Approved",
        )
    ]

    return schemas.PendingTotal(
        employee_id=employee_id,
        pending_reimbursement_total=round(
            sum(
                c.amount
                for c in pending
            ),
            2,
        ),
        claim_count=len(pending),
    )


def project_expense_rollup(
    db: Session,
    project_id: str,
) -> schemas.ProjectExpenseRollup:

    claims = (
        db.query(models.ExpenseClaim)
        .filter(
            models.ExpenseClaim.project_id
            == project_id
        )
        .all()
    )

    by_status: dict = defaultdict(float)

    for c in claims:
        by_status[c.status] += c.amount

    return schemas.ProjectExpenseRollup(
        project_id=project_id,
        total_amount=round(
            sum(
                c.amount
                for c in claims
            ),
            2,
        ),
        claim_count=len(claims),
        by_status=dict(by_status),
    )