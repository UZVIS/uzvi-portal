from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.modules.documents import service
from app.modules.documents.schemas import (
    DocumentCreate,
    DocumentResponse,
    DocumentAccessLogResponse,
)

router = APIRouter(prefix="/api/v1/documents", tags=["M8 Document Repository"])


@router.post("/", response_model=DocumentResponse, status_code=201)
def register_document_record(doc_in: DocumentCreate, db: Session = Depends(get_db)):
    try:
        return service.create_document(db, doc_in)
    except service.DocumentAlreadyExists:
        raise HTTPException(status_code=400, detail="Document record ID already exists.")


@router.get("/{document_id}", response_model=DocumentResponse)
def view_document_record(
    document_id: str, requester_id: str, db: Session = Depends(get_db)
):
    try:
        return service.view_document(db, document_id, requester_id)
    except service.DocumentNotFound:
        raise HTTPException(status_code=404, detail="Document record not found.")


@router.get("/{document_id}/logs", response_model=List[DocumentAccessLogResponse])
def get_document_audit_trail(document_id: str, db: Session = Depends(get_db)):
    return service.get_access_logs(db, document_id)
