from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, ConfigDict

from .models import OutputType, CostComponent


# ---------- Opportunity ----------

class OpportunityCreate(BaseModel):
    name: str
    client: str


class OpportunityRead(OpportunityCreate):
    model_config = ConfigDict(from_attributes=True)
    opportunity_id: str


# ---------- Standard Cost Library (FR-BD-06) ----------

class LibraryItemCreate(BaseModel):
    name: str
    unit_cost: float
    category: Optional[str] = None
    cost_component: CostComponent = CostComponent.VENDOR


class LibraryItemRead(LibraryItemCreate):
    model_config = ConfigDict(from_attributes=True)
    item_id: str


# ---------- Cost Line Item (FR-BD-01) ----------

class CostLineItemCreate(BaseModel):
    description: str
    vendor_cost: float = 0.0
    internal_cost: float = 0.0
    quantity: int = Field(default=1, ge=1)
    cohort: Optional[str] = None
    library_item_id: Optional[str] = None


class CostLineItemRead(CostLineItemCreate):
    model_config = ConfigDict(from_attributes=True)
    line_item_id: str
    scenario_id: str


# ---------- Quote Scenario (FR-BD-04, FR-BD-05) ----------

class QuoteScenarioCreate(BaseModel):
    opportunity_id: str
    created_by: str
    name: str = "Untitled scenario"
    output_type: OutputType = OutputType.QUOTE
    target_margin: float = Field(..., ge=0, lt=1, description="e.g. 0.30 for 30%")


class QuoteScenarioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    scenario_id: str
    opportunity_id: str
    created_by: str
    name: str
    output_type: OutputType
    target_margin: float
    created_at: datetime
    line_items: List[CostLineItemRead] = []


# ---------- Computed output views (FR-BD-02, FR-BD-03, FR-BD-04) ----------

class QuoteViewLine(BaseModel):
    """Client-facing: one rolled-up price per line, no vendor breakdown."""
    line_item_id: str
    description: str
    quantity: int
    cohort: Optional[str]
    unit_price: float   # embeds vendor + internal cost + margin
    line_total: float


class QuoteView(BaseModel):
    scenario_id: str
    output_type: OutputType = OutputType.QUOTE
    target_margin: float
    lines: List[QuoteViewLine]
    total_cost: float
    selling_price: float
    resulting_margin: float


class TenderViewLine(BaseModel):
    """Tender-formatted: vendor and internal/service cost broken out explicitly."""
    line_item_id: str
    description: str
    quantity: int
    cohort: Optional[str]
    vendor_unit_cost: float
    internal_unit_cost: float
    vendor_line_total: float
    internal_line_total: float
    selling_unit_price: float
    selling_line_total: float


class TenderView(BaseModel):
    scenario_id: str
    output_type: OutputType = OutputType.TENDER
    target_margin: float
    lines: List[TenderViewLine]
    total_vendor_cost: float
    total_internal_cost: float
    total_cost: float
    selling_price: float
    resulting_margin: float
