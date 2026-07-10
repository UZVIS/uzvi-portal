import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
import app.modules.directory.models  # noqa: F401 - registers Employee for the FK
from app.modules.directory import service as directory_service
from app.modules.directory.schemas import EmployeeCreate
from app.modules.documents import service
from app.modules.documents.schemas import DocumentCreate


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    directory_service.create_employee(session, EmployeeCreate(employee_id="E001", name="Asha Rao"))
    yield session
    session.close()


def test_create_document(db):
    doc = service.create_document(
        db,
        DocumentCreate(
            document_id="D001",
            employee_id="E001",
            uploaded_by="E001",
            doc_type="offer_letter",
            file_path="/secure/E001/offer_letter.pdf",
        ),
    )
    assert doc.document_id == "D001"


def test_view_document_writes_access_log(db):
    service.create_document(
        db,
        DocumentCreate(
            document_id="D001",
            employee_id="E001",
            uploaded_by="E001",
            doc_type="offer_letter",
            file_path="/secure/E001/offer_letter.pdf",
        ),
    )
    service.view_document(db, "D001", requester_id="E001")

    logs = service.get_access_logs(db, "D001")
    assert len(logs) == 1
    assert logs[0].action == "VIEW"


def test_view_missing_document_raises(db):
    with pytest.raises(service.DocumentNotFound):
        service.view_document(db, "NOPE", requester_id="E001")
