

# from sqlalchemy import Column, String, Float, Date, Boolean, ForeignKey
# from sqlalchemy.orm import relationship

# from app.database import Base
# from app.modules.directory.models import Employee  # noqa: F401  (imported for FK resolution)


# class Project(Base):
#     """Real projects and pseudo-projects (Bench, Training, Internal, BD/Presales, Leave)."""
#     __tablename__ = "project"

#     project_id = Column(String, primary_key=True)
#     name = Column(String, nullable=False)
#     # Enum-style field per ER diagram: real project | Bench | Training | Internal | BD/Presales | Leave
#     project_type = Column(String, nullable=False)
#     billing_rate = Column(Float, nullable=True)   # pseudo-projects may have no billing rate
#     cost_rate = Column(Float, nullable=True)

#     time_entries = relationship("TimeEntry", back_populates="project")


# class TimeEntry(Base):
#     """A single logged block of hours against a project. FR-UTL-01."""
#     __tablename__ = "time_entry"

#     entry_id = Column(String, primary_key=True)
#     employee_id = Column(String, ForeignKey("employees.employee_id"), nullable=False)
#     project_id = Column(String, ForeignKey("project.project_id"), nullable=False)
#     date = Column(Date, nullable=False)
#     hours = Column(Float, nullable=False)
#     billable_flag = Column(Boolean, nullable=False, default=False)

#     source = Column(String, nullable=False, default="manual")  # manual | import

#     employee = relationship("Employee")
#     project = relationship("Project", back_populates="time_entries")
#     notes = Column(String, nullable=True)



from sqlalchemy import Column, String, Float, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base
from app.modules.directory.models import Employee  # noqa: F401  (imported for FK resolution)


class Project(Base):
    __tablename__ = "project"

    project_id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    # Enum-style field per ER diagram: real project | Bench | Training | Internal | BD/Presales | Leave
    project_type = Column(String, nullable=False)
    billing_rate = Column(Float, nullable=True)   # pseudo-projects may have no billing rate
    cost_rate = Column(Float, nullable=True)

    time_entries = relationship("TimeEntry", back_populates="project")


class TimeEntry(Base):
    """A single logged block of hours against a project. FR-UTL-01."""
    __tablename__ = "time_entry"

    entry_id = Column(String, primary_key=True)
    employee_id = Column(String, ForeignKey("employees.employee_id"), nullable=False)
    project_id = Column(String, ForeignKey("project.project_id"), nullable=False)
    date = Column(Date, nullable=False)
    hours = Column(Float, nullable=False)
    billable_flag = Column(Boolean, nullable=False, default=False)

    source = Column(String, nullable=False, default="manual")  # manual | import
    # FR-UTL-01: notes field alongside date/hours/billable_flag - was missing.
    notes = Column(String, nullable=True)

    normal_hours = Column(Float, nullable=False, default=0.0)
    overtime_hours = Column(Float, nullable=False, default=0.0)

    employee = relationship("Employee")
    project = relationship("Project", back_populates="time_entries")
