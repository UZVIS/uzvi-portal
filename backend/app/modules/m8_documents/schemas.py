from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date
from typing import Optional


class DocumentBase(BaseModel):
    employee_id: str = Field(..., description="The owner of the document record")
    document_type: str = Field(
        ..., description="Type categorization (e.g., id_proof, offer_letter)"
    )
    file_path: str = Field(..., description="Secure local or cloud target path link")
    expiry_date: Optional[date] = Field(
        None, description="DPDP retention compliance target limit tracking"
    )


class DocumentCreate(DocumentBase):
    document_id: str = Field(..., description="Unique alphanumeric tracking signature")


class DocumentResponse(DocumentBase):
    document_id: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentAccessLogResponse(BaseModel):
    log_id: int
    document_id: str
    actor_id: str
    action: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
