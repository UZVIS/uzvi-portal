"""
M13 business logic (kept separate from routes/models per the FRD's layering
convention: Python business logic -> storage -> FastAPI routes -> React).

Margin convention (FR-BD-04): target_margin is a MARGIN on selling price,
not a markup on cost. i.e. target_margin = (selling_price - cost) / selling_price.
Rearranged, required selling price = cost / (1 - target_margin).
This is applied uniformly per line, so per-line prices roll up consistently
to the scenario-level total, and resulting_margin recomputes from the
actual totals (should equal target_margin barring rounding).
"""
from sqlalchemy.orm import Session

from . import models, schemas


# ---------- Opportunity ----------

def create_opportunity(db: Session, data: schemas.OpportunityCreate) -> models.Opportunity:
    obj = models.Opportunity(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_opportunity(db: Session, opportunity_id: str) -> models.Opportunity | None:
    return db.query(models.Opportunity).filter(
        models.Opportunity.opportunity_id == opportunity_id
    ).first()


def list_opportunities(db: Session) -> list[models.Opportunity]:
    return db.query(models.Opportunity).all()


# ---------- Standard Cost Library (FR-BD-06) ----------

def create_library_item(
    db: Session, data: schemas.LibraryItemCreate
) -> models.StandardCostLibrary:
    obj = models.StandardCostLibrary(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def list_library_items(db: Session) -> list[models.StandardCostLibrary]:
    return db.query(models.StandardCostLibrary).all()


# ---------- Quote Scenario (FR-BD-05) ----------

def create_scenario(
    db: Session, data: schemas.QuoteScenarioCreate
) -> models.QuoteScenario:
    obj = models.QuoteScenario(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_scenario(db: Session, scenario_id: str) -> models.QuoteScenario | None:
    return db.query(models.QuoteScenario).filter(
        models.QuoteScenario.scenario_id == scenario_id
    ).first()


def list_scenarios_for_opportunity(
    db: Session, opportunity_id: str
) -> list[models.QuoteScenario]:
    return db.query(models.QuoteScenario).filter(
        models.QuoteScenario.opportunity_id == opportunity_id
    ).all()


def add_line_item(
    db: Session, scenario_id: str, data: schemas.CostLineItemCreate
) -> models.CostLineItem:
    """
    Add a cost line item to a scenario (FR-BD-01). If library_item_id is
    given, that library item's unit_cost overrides whichever of
    vendor_cost/internal_cost matches its cost_component -- pulling from
    the library (FR-BD-06) shouldn't require re-typing the rate.
    """  
    payload = data.model_dump()
    if payload.get("library_item_id"):
     lib_item = db.query(models.StandardCostLibrary).filter(
        models.StandardCostLibrary.item_id == payload["library_item_id"]
    ).first()

    if lib_item is None:
        raise ValueError("Library item not found")

    if lib_item.cost_component == models.CostComponent.VENDOR:
        payload["vendor_cost"] = lib_item.unit_cost
    else:
        payload["internal_cost"] = lib_item.unit_cost
    obj = models.CostLineItem(scenario_id=scenario_id, **payload)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ---------- Margin math (FR-BD-04) ----------

def _required_selling_price(total_cost: float, target_margin: float) -> float:
    """cost / (1 - margin). target_margin=0 -> sell at cost."""
    if target_margin >= 1:
        raise ValueError("target_margin must be < 1 (100%)")
    return total_cost / (1 - target_margin)


def _resulting_margin(total_cost: float, selling_price: float) -> float:
    if selling_price == 0:
        return 0.0
    return (selling_price - total_cost) / selling_price


# ---------- Output views (FR-BD-02, FR-BD-03) ----------

def compute_quote_view(scenario: models.QuoteScenario) -> schemas.QuoteView:
    """Client-facing: per-line rolled-up price, vendor/internal cost embedded."""
    lines: list[schemas.QuoteViewLine] = []
    total_cost = 0.0

    for li in scenario.line_items:
        line_cost = (li.vendor_cost + li.internal_cost) * li.quantity
        total_cost += line_cost
        unit_cost = li.vendor_cost + li.internal_cost
        unit_price = _required_selling_price(unit_cost, scenario.target_margin)
        lines.append(
            schemas.QuoteViewLine(
                line_item_id=li.line_item_id,
                description=li.description,
                quantity=li.quantity,
                cohort=li.cohort,
                unit_price=round(unit_price, 2),
                line_total=round(unit_price * li.quantity, 2),
            )
        )

    selling_price = _required_selling_price(total_cost, scenario.target_margin)
    return schemas.QuoteView(
        scenario_id=scenario.scenario_id,
        target_margin=scenario.target_margin,
        lines=lines,
        total_cost=round(total_cost, 2),
        selling_price=round(selling_price, 2),
        resulting_margin=round(_resulting_margin(total_cost, selling_price), 4),
    )


def compute_tender_view(scenario: models.QuoteScenario) -> schemas.TenderView:
    """Tender-formatted: vendor and internal cost broken out per line, explicit."""
    lines: list[schemas.TenderViewLine] = []
    total_vendor_cost = 0.0
    total_internal_cost = 0.0

    for li in scenario.line_items:
        vendor_line_total = li.vendor_cost * li.quantity
        internal_line_total = li.internal_cost * li.quantity
        total_vendor_cost += vendor_line_total
        total_internal_cost += internal_line_total

        unit_cost = li.vendor_cost + li.internal_cost
        selling_unit_price = _required_selling_price(unit_cost, scenario.target_margin)
        lines.append(
            schemas.TenderViewLine(
                line_item_id=li.line_item_id,
                description=li.description,
                quantity=li.quantity,
                cohort=li.cohort,
                vendor_unit_cost=li.vendor_cost,
                internal_unit_cost=li.internal_cost,
                vendor_line_total=round(vendor_line_total, 2),
                internal_line_total=round(internal_line_total, 2),
                selling_unit_price=round(selling_unit_price, 2),
                selling_line_total=round(selling_unit_price * li.quantity, 2),
            )
        )

    total_cost = total_vendor_cost + total_internal_cost
    selling_price = _required_selling_price(total_cost, scenario.target_margin)
    return schemas.TenderView(
        scenario_id=scenario.scenario_id,
        target_margin=scenario.target_margin,
        lines=lines,
        total_vendor_cost=round(total_vendor_cost, 2),
        total_internal_cost=round(total_internal_cost, 2),
        total_cost=round(total_cost, 2),
        selling_price=round(selling_price, 2),
        resulting_margin=round(_resulting_margin(total_cost, selling_price), 4),
    )
