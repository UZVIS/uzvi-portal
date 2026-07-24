"""
M13 — Quote & Tender Calculator (BD)

Tables per the ERD, extended where the FRD requires fields the ERD only
implies:
- FR-BD-01 requires per-user counts and cohort splits -> CostLineItem gets
  `quantity` (the per-user/per-line count) and `cohort` (nullable label).
- FR-BD-06's library needs to tell us whether a standard item is a vendor
  cost (e.g. a software license) or an internal cost (e.g. a day-rate), so
  pulling it into a scenario populates the right cost field ->
  StandardCostLibrary gets `cost_component`.
"""
import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, Integer, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class OutputType(str, enum.Enum):
    """QuoteScenario.output_type — FR-BD-02 / FR-BD-03."""
    QUOTE = "quote"
    TENDER = "tender"


class CostComponent(str, enum.Enum):
    """Which side of the cost split a standard library item belongs to."""
    VENDOR = "vendor"
    INTERNAL = "internal"


class Opportunity(Base):
    __tablename__ = "opportunities"

    opportunity_id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    client = Column(String, nullable=False)

    scenarios = relationship(
        "QuoteScenario", back_populates="opportunity", cascade="all, delete-orphan"
    )


class QuoteScenario(Base):
    __tablename__ = "quote_scenarios"

    scenario_id = Column(String, primary_key=True, default=_uuid)
    opportunity_id = Column(
        String, ForeignKey("opportunities.opportunity_id"), nullable=False, index=True
    )
    created_by = Column(String, ForeignKey("employees.employee_id"), nullable=False)
    name = Column(String, nullable=False, default="Untitled scenario")
    output_type = Column(Enum(OutputType), nullable=False, default=OutputType.QUOTE)
    target_margin = Column(Float, nullable=False)  # e.g. 0.30 = 30%
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    opportunity = relationship("Opportunity", back_populates="scenarios")
    line_items = relationship(
        "CostLineItem", back_populates="scenario", cascade="all, delete-orphan"
    )


class StandardCostLibrary(Base):
    __tablename__ = "standard_cost_library"

    item_id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    unit_cost = Column(Float, nullable=False)
    category = Column(String, nullable=True)
    cost_component = Column(
        Enum(CostComponent), nullable=False, default=CostComponent.VENDOR
    )


class CostLineItem(Base):
    __tablename__ = "cost_line_items"

    line_item_id = Column(String, primary_key=True, default=_uuid)
    scenario_id = Column(
        String, ForeignKey("quote_scenarios.scenario_id"), nullable=False, index=True
    )
    library_item_id = Column(
        String, ForeignKey("standard_cost_library.item_id"), nullable=True
    )
    description = Column(String, nullable=False)
    vendor_cost = Column(Float, nullable=False, default=0.0)   # per unit
    internal_cost = Column(Float, nullable=False, default=0.0)  # per unit
    quantity = Column(Integer, nullable=False, default=1)       # per-user/per-line count
    cohort = Column(String, nullable=True)                      # cohort split label

    scenario = relationship("QuoteScenario", back_populates="line_items")
