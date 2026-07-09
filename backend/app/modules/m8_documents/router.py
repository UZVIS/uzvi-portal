from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import os

from app.modules.m8_documents.models import EmployeeDocument, DocumentAccessLog
from app.modules.m8_documents.schemas import (
    DocumentCreate,
    DocumentResponse,
    DocumentAccessLogResponse,
)


def get_db():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    database_url = os.getenv("DATABASE_URL", "sqlite:///uzvi_portal.db")
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False} if "sqlite" in database_url else {},
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


router = APIRouter(
    prefix="/api/v1/documents", tags=["M8 Document Management Operations"]
)


@router.post("/", response_model=DocumentResponse, status_code=201)
def register_document_record(doc_in: DocumentCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(EmployeeDocument)
        .filter(EmployeeDocument.document_id == doc_in.document_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Document record ID already exists."
        )

    new_doc = EmployeeDocument(**doc_in.model_dump())
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc


@router.get("/{document_id}", response_model=DocumentResponse)
def view_document_record(
    document_id: str, requester_id: str, db: Session = Depends(get_db)
):
    doc = (
        db.query(EmployeeDocument)
        .filter(EmployeeDocument.document_id == document_id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document record not found.")

    audit_log = DocumentAccessLog(
        document_id=document_id, actor_id=requester_id, action="VIEW"
    )
    db.add(audit_log)
    db.commit()

    return doc


@router.get("/{document_id}/logs", response_model=List[DocumentAccessLogResponse])
def get_document_audit_trail(document_id: str, db: Session = Depends(get_db)):
    return (
        db.query(DocumentAccessLog)
        .filter(DocumentAccessLog.document_id == document_id)
        .all()
    )
