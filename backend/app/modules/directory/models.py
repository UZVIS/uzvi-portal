from sqlalchemy import Column, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(String, primary_key=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    role_designation = Column(String, nullable=True)
    team = Column(String, nullable=True)
    reporting_manager_id = Column(
        String, ForeignKey("employees.employee_id"), nullable=True
    )
    join_date = Column(Date, nullable=True)

    employment_status = Column(String, default="active", nullable=False)

    access_tier = Column(String, default="Employee", nullable=False)
    contact_details = Column(String, nullable=True)

    manager = relationship(
        "Employee", remote_side=[employee_id], backref="subordinates"
    )
