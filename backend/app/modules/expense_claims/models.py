# from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey
# from sqlalchemy.orm import relationship

# from app.database import Base
# from app.modules.directory.models import Employee  # noqa: F401
# from app.modules.consultant_utilization.models import Project  # noqa: F401


# class ExpenseCategory(Base):
#     __tablename__ = "expense_category"

#     category_id = Column(String, primary_key=True)
#     name = Column(String, nullable=False)
#     cap_amount = Column(Float, nullable=True)

#     claims = relationship("ExpenseClaim", back_populates="category")


# class ExpenseClaim(Base):
#     __tablename__ = "expense_claim"

#     claim_id = Column(String, primary_key=True)
#     employee_id = Column(String, ForeignKey("employees.employee_id"), nullable=False)
#     category_id = Column(String, ForeignKey("expense_category.category_id"), nullable=False)
#     project_id = Column(String, ForeignKey("project.project_id"), nullable=True)

#     amount = Column(Float, nullable=False)
#     date = Column(Date, nullable=False)
#     status = Column(String, nullable=False, default="Submitted")

#     description = Column(String, nullable=True)

#     receipt_file_path = Column(String, nullable=True)

#     decided_by_role = Column(String, nullable=True)
#     decided_at = Column(DateTime(timezone=True), nullable=True)

#     employee = relationship("Employee")
#     category = relationship("ExpenseCategory", back_populates="claims")
#     project = relationship("Project")

#     @property
#     def employee_name(self) -> str | None:
#         return self.employee.name if self.employee is not None else None

from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey
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

    decided_by_role = Column(String, nullable=True)
    # employee_id of whoever actually approved/rejected this claim,
    # so the UI can show their name instead of just their access tier.
    decided_by = Column(String, ForeignKey("employees.employee_id"), nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)

    # Two FKs now point at Employee (employee_id and decided_by), so each
    # relationship must be told explicitly which FK it uses.
    employee = relationship("Employee", foreign_keys=[employee_id])
    decider = relationship("Employee", foreign_keys=[decided_by])
    category = relationship("ExpenseCategory", back_populates="claims")
    project = relationship("Project")

    @property
    def employee_name(self) -> str | None:
        return self.employee.name if self.employee is not None else None

    @property
    def decided_by_name(self) -> str | None:
        return self.decider.name if self.decider is not None else None