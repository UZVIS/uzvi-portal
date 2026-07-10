from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Date
from sqlalchemy.orm import relationship
import datetime

from app.database import Base


class EmployeeDocument(Base):
    __tablename__ = "employee_documents"

    document_id = Column(String, primary_key=True, index=True, nullable=False)
    employee_id = Column(String, ForeignKey("employees.employee_id"), nullable=False)
    uploaded_by = Column(String, ForeignKey("employees.employee_id"), nullable=False)

    doc_type = Column(String, nullable=False)
    retention_expiry = Column(Date, nullable=True)

    # Not in the ER diagram, but a document repository can't function
    # without knowing where the file actually is or when it landed.
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    employee = relationship("Employee", foreign_keys=[employee_id])
    uploader = relationship("Employee", foreign_keys=[uploaded_by])
    access_logs = relationship(
        "DocumentAccessLog", back_populates="document", cascade="all, delete-orphan"
    )


class DocumentAccessLog(Base):
    __tablename__ = "document_access_logs"

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(
        String, ForeignKey("employee_documents.document_id"), nullable=False
    )

    accessed_by = Column(String, ForeignKey("employees.employee_id"), nullable=False)
    action = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    document = relationship("EmployeeDocument", back_populates="access_logs")
    accessor = relationship("Employee", foreign_keys=[accessed_by])
