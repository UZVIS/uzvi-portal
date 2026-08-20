import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.modules.directory.models import Employee
from app.modules.documents import service
from app.modules.documents.schemas import DocumentCreate


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    # Bootstrap employees directly (not via directory.service, to avoid that
    # module's own new requester_id requirement leaking into these tests).
    session.add(Employee(employee_id="EMP001", name="Asha Rao", access_tier="Employee"))
    session.add(Employee(employee_id="EMP002", name="Ravi Kumar", access_tier="Employee"))
    session.add(Employee(employee_id="EMP003", name="HR Person", access_tier="HR-Restricted"))
    session.commit()
    yield session
    session.close()


def test_create_document_self_upload(db):
    # an employee may self-upload their own document.
    doc = service.create_document(
        db,
        DocumentCreate(
            employee_id="EMP001",
            uploaded_by="EMP001",
            doc_type="offer_letter",
        ),
    )
    assert doc.document_id == "DOC001"


def test_create_document_by_hr_for_someone_else(db):
    # HR-Restricted uploads on an employee's behalf.
    doc = service.create_document(
        db,
        DocumentCreate(
            employee_id="EMP001",
            uploaded_by="EMP003",
            doc_type="offer_letter",
        ),
    )
    assert doc.document_id == "DOC001"


def test_create_document_by_unrelated_employee_raises(db):
    # EMP002 is neither HR-Restricted nor the document's owner (EMP001).
    with pytest.raises(service.NotAuthorized):
        service.create_document(
            db,
            DocumentCreate(
                employee_id="EMP001",
                uploaded_by="EMP002",
                doc_type="offer_letter",
            ),
        )


def test_document_ids_auto_generate_in_sequence(db):
    a = service.create_document(
        db, DocumentCreate(employee_id="EMP001", uploaded_by="EMP001", doc_type="id_proof")
    )
    b = service.create_document(
        db, DocumentCreate(employee_id="EMP002", uploaded_by="EMP002", doc_type="id_proof")
    )
    assert a.document_id == "DOC001"
    assert b.document_id == "DOC002"


def test_view_document_by_owner_writes_access_log(db):
    doc = service.create_document(
        db,
        DocumentCreate(employee_id="EMP001", uploaded_by="EMP001", doc_type="offer_letter"),
    )
    service.view_document(db, doc.document_id, requester_id="EMP001")

    logs = service.get_access_logs(db, doc.document_id)
    assert len(logs) == 1
    assert logs[0].action == "VIEW"


def test_view_document_by_hr_succeeds(db):
    doc = service.create_document(
        db,
        DocumentCreate(employee_id="EMP001", uploaded_by="EMP001", doc_type="offer_letter"),
    )
    viewed = service.view_document(db, doc.document_id, requester_id="EMP003")
    assert viewed.document_id == doc.document_id


def test_view_document_by_unrelated_employee_raises(db):
    # EMP002 is neither the owner nor HR-Restricted.
    doc = service.create_document(
        db,
        DocumentCreate(employee_id="EMP001", uploaded_by="EMP001", doc_type="offer_letter"),
    )
    with pytest.raises(service.NotAuthorized):
        service.view_document(db, doc.document_id, requester_id="EMP002")


def test_view_missing_document_raises(db):
    with pytest.raises(service.DocumentNotFound):
        service.view_document(db, "NOPE", requester_id="EMP001")


def test_list_visible_documents_shows_only_own_even_for_hr(db):
    # The list is a read-only browse, never logged - so even HR only
    # sees their own documents here. Looking up someone else's document
    # goes through view_document() instead, which is properly logged.
    service.create_document(
        db, DocumentCreate(employee_id="EMP001", uploaded_by="EMP001", doc_type="id_proof")
    )
    doc2 = service.create_document(
        db, DocumentCreate(employee_id="EMP003", uploaded_by="EMP003", doc_type="payslip")
    )
    visible = service.list_visible_documents(db, "EMP003")
    ids = [d.document_id for d in visible]
    assert ids == [doc2.document_id]


def test_list_visible_documents_employee_sees_only_own(db):
    doc1 = service.create_document(
        db, DocumentCreate(employee_id="EMP001", uploaded_by="EMP001", doc_type="id_proof")
    )
    service.create_document(
        db, DocumentCreate(employee_id="EMP002", uploaded_by="EMP003", doc_type="payslip")
    )
    visible = service.list_visible_documents(db, "EMP001")
    ids = [d.document_id for d in visible]
    assert ids == [doc1.document_id]


def test_expired_document_is_flagged(db):
    doc = service.create_document(
        db,
        DocumentCreate(
            employee_id="EMP001", uploaded_by="EMP001",
            doc_type="id_proof", retention_expiry="2020-01-01",
        ),
    )
    expired = service.list_expired_documents(db, "EMP003")
    assert len(expired) == 1
    assert expired[0].document_id == doc.document_id


def test_document_with_no_expiry_is_never_flagged(db):
    service.create_document(
        db,
        DocumentCreate(employee_id="EMP001", uploaded_by="EMP001", doc_type="id_proof"),
    )
    expired = service.list_expired_documents(db, "EMP003")
    assert expired == []


def test_list_expired_documents_by_non_hr_raises(db):
    with pytest.raises(service.NotAuthorized):
        service.list_expired_documents(db, "EMP001")