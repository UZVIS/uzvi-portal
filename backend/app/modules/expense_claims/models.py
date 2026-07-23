from sqlalchemy import Column, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base
from app.modules.directory.models import Employee  # noqa: F401
from app.modules.consultant_utilization.models import Project  # noqa: F401


class ExpenseCategory(Base):
    __tablename__ = "expense_category"

    category_id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    cap_amount = Column(Float, nullable=True)

    claims = relationship("ExpenseClaim", back_populates="category")


class ExpenseClaim(Base):
    __tablename__ = "expense_claim"

    claim_id = Column(String, primary_key=True)
    employee_id = Column(String, ForeignKey("employees.employee_id"), nullable=False)
    category_id = Column(String, ForeignKey("expense_category.category_id"), nullable=False)
    project_id = Column(String, ForeignKey("project.project_id"), nullable=True)

    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String, nullable=False, default="Submitted")

    description = Column(String, nullable=True)
    
    receipt_file_path = Column(String, nullable=True)

    employee = relationship("Employee")
    category = relationship("ExpenseCategory", back_populates="claims")
    project = relationship("Project")