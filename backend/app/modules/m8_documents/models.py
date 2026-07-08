from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Date
from sqlalchemy.orm import relationship
import datetime
from app.modules.m0_employee.models import Base


class EmployeeDocument(Base):
    __tablename__ = "employee_documents"

    document_id = Column(String, primary_key=True, index=True, nullable=False)
    employee_id = Column(String, ForeignKey("employees.employee_id"), nullable=False)

    document_type = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    expiry_date = Column(Date, nullable=True)

    employee = relationship("Employee", foreign_keys=[employee_id])
    access_logs = relationship(
        "DocumentAccessLog", back_populates="document", cascade="all, delete-orphan"
    )


class DocumentAccessLog(Base):
    __tablename__ = "document_access_logs"

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(
        String, ForeignKey("employee_documents.document_id"), nullable=False
    )

    actor_id = Column(String, ForeignKey("employees.employee_id"), nullable=False)
    action = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    document = relationship("EmployeeDocument", back_populates="access_logs")
    actor = relationship("Employee", foreign_keys=[actor_id])
