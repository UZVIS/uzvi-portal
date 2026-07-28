import datetime

from sqlalchemy.orm import Session

from app.modules.directory.models import Employee
from app.modules.documents.models import EmployeeDocument, DocumentAccessLog
from app.modules.documents.schemas import DocumentCreate


class DocumentAlreadyExists(Exception):
    pass


class DocumentNotFound(Exception):
    pass


class NotAuthorized(Exception):
    pass


def _get_requester(db: Session, requester_id: str) -> Employee | None:
    return db.query(Employee).filter(Employee.employee_id == requester_id).first()


def create_document(db: Session, doc_in: DocumentCreate) -> EmployeeDocument:
    uploader = _get_requester(db, doc_in.uploaded_by)
    is_hr = uploader is not None and uploader.access_tier == "HR-Restricted"
    is_self_upload = doc_in.uploaded_by == doc_in.employee_id
    if not (is_hr or is_self_upload):
        raise NotAuthorized(
            "Only HR-Restricted staff, or the employee themselves, may upload a document."
        )

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

    requester = _get_requester(db, requester_id)
    is_owner = requester_id == doc.employee_id
    is_hr = requester is not None and requester.access_tier == "HR-Restricted"
    if not (is_owner or is_hr):
        raise NotAuthorized(
            "Only the document owner and HR-Restricted staff may view this document."
        )

    db.add(DocumentAccessLog(document_id=document_id, accessed_by=requester_id, action="VIEW"))
    db.commit()
    return doc


def get_access_logs(db: Session, document_id: str) -> list[DocumentAccessLog]:
    return (
        db.query(DocumentAccessLog)
        .filter(DocumentAccessLog.document_id == document_id)
        .all()
    )


def is_document_expired(doc: EmployeeDocument) -> bool:
    if doc.retention_expiry is None:
        return False
    return datetime.date.today() > doc.retention_expiry


def list_expired_documents(db: Session, requester_id: str) -> list[EmployeeDocument]:
    requester = _get_requester(db, requester_id)
    if requester is None or requester.access_tier != "HR-Restricted":
        raise NotAuthorized("Only HR-Restricted staff may view expired documents.")

    all_docs = (
        db.query(EmployeeDocument)
        .filter(EmployeeDocument.retention_expiry.isnot(None))
        .all()
    )
    return [doc for doc in all_docs if is_document_expired(doc)]