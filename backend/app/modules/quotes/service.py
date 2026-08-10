
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

def delete_scenario(db: Session, scenario_id: str) -> bool:
    scenario = get_scenario(db, scenario_id)

    if not scenario:
        return False

    db.delete(scenario)
    db.commit()

    return True

def update_scenario(
    db: Session,
    scenario_id: str,
    data: schemas.QuoteScenarioUpdate,
) -> models.QuoteScenario | None:

    scenario = get_scenario(db, scenario_id)

    if not scenario:
        return None

    scenario.name = data.name
    scenario.output_type = data.output_type
    scenario.target_margin = data.target_margin

    db.commit()
    db.refresh(scenario)

    return scenario

def list_scenarios_for_opportunity(
    db: Session, opportunity_id: str
) -> list[models.QuoteScenario]:
    return db.query(models.QuoteScenario).filter(
        models.QuoteScenario.opportunity_id == opportunity_id
    ).all()

def compare_scenarios(
    db: Session,
    opportunity_id: str,
    scenario_ids: list[str],
) -> schemas.ScenarioComparison:

    scenarios = (
        db.query(models.QuoteScenario)
        .filter(
            models.QuoteScenario.opportunity_id == opportunity_id,
            models.QuoteScenario.scenario_id.in_(scenario_ids),
        )
        .all()
    )

    # Make sure every requested scenario belongs to this opportunity
    found_ids = {scenario.scenario_id for scenario in scenarios}

    if len(found_ids) != len(set(scenario_ids)):
        raise ValueError(
            "One or more scenarios do not belong to this opportunity"
        )

    comparison_items = []

    for scenario in scenarios:

        quote_view = compute_quote_view(scenario)

        comparison_items.append(
            schemas.ScenarioComparisonItem(
                scenario_id=scenario.scenario_id,
                scenario_name=scenario.name,
                output_type=scenario.output_type,
                target_margin=quote_view.target_margin,
                total_cost=quote_view.total_cost,
                selling_price=quote_view.selling_price,
                resulting_margin=quote_view.resulting_margin,
            )
        )

    return schemas.ScenarioComparison(
        opportunity_id=opportunity_id,
        scenarios=comparison_items,
    )

def duplicate_scenario(
    db: Session,
    scenario_id: str,
    data: schemas.ScenarioDuplicateRequest,
) -> models.QuoteScenario | None:

    original = get_scenario(db, scenario_id)

    if not original:
        return None

    # Create new scenario with the same configuration
    new_scenario = models.QuoteScenario(
        opportunity_id=original.opportunity_id,
        created_by=original.created_by,
        name=data.name,
        output_type=original.output_type,
        target_margin=original.target_margin,
    )

    db.add(new_scenario)
    db.flush()

    # Copy all line items
    for item in original.line_items:
        new_item = models.CostLineItem(
            scenario_id=new_scenario.scenario_id,
            library_item_id=item.library_item_id,
            description=item.description,
            vendor_cost=item.vendor_cost,
            internal_cost=item.internal_cost,
            quantity=item.quantity,
            cohort=item.cohort,
        )

        db.add(new_item)

    db.commit()
    db.refresh(new_scenario)

    return new_scenario


def compare_scenarios(
    db: Session,
    opportunity_id: str,
    scenario_ids: list[str],
) -> schemas.ScenarioComparison:

    scenarios = (
        db.query(models.QuoteScenario)
        .filter(
            models.QuoteScenario.opportunity_id == opportunity_id,
            models.QuoteScenario.scenario_id.in_(scenario_ids),
        )
        .all()
    )

    found_ids = {scenario.scenario_id for scenario in scenarios}

    if len(found_ids) != len(set(scenario_ids)):
        raise ValueError(
            "One or more scenarios do not belong to this opportunity"
        )

    comparison_items = []

    for scenario in scenarios:
        quote_view = compute_quote_view(scenario)

        comparison_items.append(
            schemas.ScenarioComparisonItem(
                scenario_id=scenario.scenario_id,
                scenario_name=scenario.name,
                output_type=scenario.output_type,
                target_margin=quote_view.target_margin,
                total_cost=quote_view.total_cost,
                selling_price=quote_view.selling_price,
                resulting_margin=quote_view.resulting_margin,
            )
        )

    return schemas.ScenarioComparison(
        opportunity_id=opportunity_id,
        scenarios=comparison_items,
    )
def add_line_item(
    db: Session, scenario_id: str, data: schemas.CostLineItemCreate
) -> models.CostLineItem:
     
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


def update_line_item(
    db: Session,
    line_item_id: str,
    data: schemas.CostLineItemCreate,
) -> models.CostLineItem | None:

    line_item = db.query(models.CostLineItem).filter(
        models.CostLineItem.line_item_id == line_item_id
    ).first()

    if not line_item:
        return None

    payload = data.model_dump()

    if payload.get("library_item_id"):

        lib_item = db.query(
            models.StandardCostLibrary
        ).filter(
            models.StandardCostLibrary.item_id ==
            payload["library_item_id"]
        ).first()

        if not lib_item:
            raise ValueError("Library item not found")

        if lib_item.cost_component == models.CostComponent.VENDOR:
            payload["vendor_cost"] = lib_item.unit_cost
        else:
            payload["internal_cost"] = lib_item.unit_cost

    for key, value in payload.items():
        setattr(line_item, key, value)

    db.commit()
    db.refresh(line_item)

    return line_item


def delete_line_item(
    db: Session,
    line_item_id: str,
) -> bool:

    item = db.query(models.CostLineItem).filter(
        models.CostLineItem.line_item_id == line_item_id
    ).first()

    if not item:
        return False

    db.delete(item)
    db.commit()

    return True