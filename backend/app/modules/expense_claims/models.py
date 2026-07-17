

from sqlalchemy import Column, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base
from app.modules.directory.models import Employee  # noqa: F401  (imported for FK resolution)
from app.modules.consultant_utilization.models import Project  # noqa: F401  (cross-module FK)


class ExpenseCategory(Base):
    """Configurable expense categories (travel, client entertainment, training, misc). FR-EXP-02."""
    __tablename__ = "expense_category"

    category_id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    cap_amount = Column(Float, nullable=True)  # optional per-category cap

    claims = relationship("ExpenseClaim", back_populates="category")


class ExpenseClaim(Base):
    """A single expense claim and its approval/reimbursement status. FR-EXP-01, FR-EXP-04."""
    __tablename__ = "expense_claim"

    claim_id = Column(String, primary_key=True)
    employee_id = Column(String, ForeignKey("employees.employee_id"), nullable=False)
    category_id = Column(String, ForeignKey("expense_category.category_id"), nullable=False)
    # Cross-module FK per ER diagram (marked optional there: project_id -> Project?)
    project_id = Column(String, ForeignKey("project.project_id"), nullable=True)

    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    # FR-EXP-04: Submitted -> Approved/Rejected -> Reimbursed
    status = Column(String, nullable=False, default="Submitted")

    employee = relationship("Employee")
    category = relationship("ExpenseCategory", back_populates="claims")
    project = relationship("Project")
