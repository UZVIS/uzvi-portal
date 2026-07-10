
from sqlalchemy.orm import Session

from app.modules.documents.models import EmployeeDocument, DocumentAccessLog
from app.modules.documents.schemas import DocumentCreate


class DocumentAlreadyExists(Exception):
    pass


class DocumentNotFound(Exception):
    pass


def create_document(db: Session, doc_in: DocumentCreate) -> EmployeeDocument:
    existing = get_document(db, doc_in.document_id)
    if existing:
        raise DocumentAlreadyExists(doc_in.document_id)

    new_doc = EmployeeDocument(**doc_in.model_dump())
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc


def get_document(db: Session, document_id: str) -> EmployeeDocument | None:
    return (
        db.query(EmployeeDocument)
        .filter(EmployeeDocument.document_id == document_id)
        .first()
    )


def view_document(db: Session, document_id: str, requester_id: str) -> EmployeeDocument:
   
    doc = get_document(db, document_id)
    if not doc:
        raise DocumentNotFound(document_id)

    db.add(DocumentAccessLog(document_id=document_id, accessed_by=requester_id, action="VIEW"))
    db.commit()
    return doc


def get_access_logs(db: Session, document_id: str) -> list[DocumentAccessLog]:
    return (
        db.query(DocumentAccessLog)
        .filter(DocumentAccessLog.document_id == document_id)
        .all()
    )
