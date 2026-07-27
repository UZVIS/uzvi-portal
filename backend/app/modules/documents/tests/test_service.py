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
    session.add(Employee(employee_id="E001", name="Asha Rao", access_tier="Employee"))
    session.add(Employee(employee_id="E002", name="Ravi Kumar", access_tier="Employee"))
    session.add(Employee(employee_id="HR1", name="HR Person", access_tier="HR-Restricted"))
    session.commit()
    yield session
    session.close()


def test_create_document_self_upload(db):
    # an employee may self-upload their own document.
    doc = service.create_document(
        db,
        DocumentCreate(
            document_id="D001",
            employee_id="E001",
            uploaded_by="E001",
            doc_type="offer_letter",
        ),
    )
    assert doc.document_id == "D001"


def test_create_document_by_hr_for_someone_else(db):
    # HR-Restricted uploads on an employee's behalf.
    doc = service.create_document(
        db,
        DocumentCreate(
            document_id="D001",
            employee_id="E001",
            uploaded_by="HR1",
            doc_type="offer_letter",
        ),
    )
    assert doc.document_id == "D001"


def test_create_document_by_unrelated_employee_raises(db):
    # E002 is neither HR-Restricted nor the document's owner (E001).
    with pytest.raises(service.NotAuthorized):
        service.create_document(
            db,
            DocumentCreate(
                document_id="D001",
                employee_id="E001",
                uploaded_by="E002",
                doc_type="offer_letter",
            ),
        )


def test_view_document_by_owner_writes_access_log(db):
    service.create_document(
        db,
        DocumentCreate(
            document_id="D001", employee_id="E001", uploaded_by="E001", doc_type="offer_letter"
        ),
    )
    service.view_document(db, "D001", requester_id="E001")

    logs = service.get_access_logs(db, "D001")
    assert len(logs) == 1
    assert logs[0].action == "VIEW"


def test_view_document_by_hr_succeeds(db):
    service.create_document(
        db,
        DocumentCreate(
            document_id="D001", employee_id="E001", uploaded_by="E001", doc_type="offer_letter"
        ),
    )
    doc = service.view_document(db, "D001", requester_id="HR1")
    assert doc.document_id == "D001"


def test_view_document_by_unrelated_employee_raises(db):
    # E002 is neither the owner nor HR-Restricted.
    service.create_document(
        db,
        DocumentCreate(
            document_id="D001", employee_id="E001", uploaded_by="E001", doc_type="offer_letter"
        ),
    )
    with pytest.raises(service.NotAuthorized):
        service.view_document(db, "D001", requester_id="E002")


def test_view_missing_document_raises(db):
    with pytest.raises(service.DocumentNotFound):
        service.view_document(db, "NOPE", requester_id="E001")


def test_expired_document_is_flagged(db):
    service.create_document(
        db,
        DocumentCreate(
            document_id="D_OLD", employee_id="E001", uploaded_by="E001",
            doc_type="id_proof", retention_expiry="2020-01-01",
        ),
    )
    expired = service.list_expired_documents(db, "HR1")
    assert len(expired) == 1
    assert expired[0].document_id == "D_OLD"


def test_document_with_no_expiry_is_never_flagged(db):
    service.create_document(
        db,
        DocumentCreate(
            document_id="D_FOREVER", employee_id="E001", uploaded_by="E001", doc_type="id_proof"
        ),
    )
    expired = service.list_expired_documents(db, "HR1")
    assert expired == []


def test_list_expired_documents_by_non_hr_raises(db):
    with pytest.raises(service.NotAuthorized):
        service.list_expired_documents(db, "E001")
