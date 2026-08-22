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


class InvalidDocType(Exception):
    pass


def _get_requester(db: Session, requester_id: str) -> Employee | None:
    return db.query(Employee).filter(Employee.employee_id == requester_id).first()


def create_document(db: Session, doc_in: DocumentCreate) -> EmployeeDocument:
    uploader = _get_requester(db, doc_in.uploaded_by)
    is_active = uploader is not None and uploader.employment_status == "active"
    is_hr = is_active and uploader.access_tier == "HR-Restricted"
    is_self_upload = is_active and doc_in.uploaded_by == doc_in.employee_id
    if not (is_hr or is_self_upload):
        raise NotAuthorized(
            "Only HR-Restricted staff, or the employee themselves, may upload a document."
        )

    valid_doc_types = {"offer_letter", "payslip", "experience_letter", "id_proof", "address_proof"}
    if doc_in.doc_type not in valid_doc_types:
        raise InvalidDocType(
            f"'{doc_in.doc_type}' is not a valid document type - must be one of: {', '.join(sorted(valid_doc_types))}."
        )

    new_document_id = _generate_next_document_id(db)
    data = doc_in.model_dump(exclude={"document_id"}, exclude_unset=True)
    new_doc = EmployeeDocument(document_id=new_document_id, **data)
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc


def _generate_next_document_id(db: Session) -> str:
    all_ids = [row[0] for row in db.query(EmployeeDocument.document_id).all()]
    max_num = 0
    for did in all_ids:
        if did.startswith("DOC") and did[3:].isdigit():
            max_num = max(max_num, int(did[3:]))
    return f"DOC{max_num + 1:03d}"


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
    is_active = requester is not None and requester.employment_status == "active"
    is_owner = is_active and requester_id == doc.employee_id
    is_hr = is_active and requester.access_tier == "HR-Restricted"
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
    if requester is None or requester.employment_status != "active" or requester.access_tier != "HR-Restricted":
        raise NotAuthorized("Only HR-Restricted staff may view expired documents.")

    all_docs = (
        db.query(EmployeeDocument)
        .filter(EmployeeDocument.retention_expiry.isnot(None))
        .all()
    )
    return [doc for doc in all_docs if is_document_expired(doc)]


def list_visible_documents(db: Session, requester_id: str) -> list[EmployeeDocument]:
   
    requester = _get_requester(db, requester_id)
    if requester is None or requester.employment_status != "active":
        raise NotAuthorized("Unknown requester.")

    return (
        db.query(EmployeeDocument)
        .filter(EmployeeDocument.employee_id == requester_id)
        .all()
    )

def check_document_exists(db: Session, employee_id: str, doc_type: str, requester_id: str) -> bool:

    requester = _get_requester(db, requester_id)
    if requester is None or requester.employment_status != "active":
        raise NotAuthorized("Unknown requester.")

    is_self = requester_id == employee_id
    is_hr = requester.access_tier == "HR-Restricted"
    if not (is_self or is_hr):#
        raise NotAuthorized("Only HR-Restricted staff or the employee themselves may check this.")

    existing = (
        db.query(EmployeeDocument)
        .filter(
            EmployeeDocument.employee_id == employee_id,
            EmployeeDocument.doc_type == doc_type,
        )
        .first()
    )
    return existing is not None
