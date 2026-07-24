from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from . import schemas, service

router = APIRouter(prefix="/quotes", tags=["M13 - Quote & Tender Calculator"])


# ---------- Opportunities ----------

@router.post("/opportunities", response_model=schemas.OpportunityRead, status_code=201)
def create_opportunity(data: schemas.OpportunityCreate, db: Session = Depends(get_db)):
    return service.create_opportunity(db, data)


@router.get("/opportunities", response_model=list[schemas.OpportunityRead])
def list_opportunities(db: Session = Depends(get_db)):
    return service.list_opportunities(db)


@router.get("/opportunities/{opportunity_id}", response_model=schemas.OpportunityRead)
def get_opportunity(opportunity_id: str, db: Session = Depends(get_db)):
    obj = service.get_opportunity(db, opportunity_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return obj


# ---------- Standard Cost Library (FR-BD-06) ----------

@router.post("/library", response_model=schemas.LibraryItemRead, status_code=201)
def create_library_item(data: schemas.LibraryItemCreate, db: Session = Depends(get_db)):
    return service.create_library_item(db, data)


@router.get("/library", response_model=list[schemas.LibraryItemRead])
def list_library_items(db: Session = Depends(get_db)):
    return service.list_library_items(db)


# ---------- Quote Scenarios (FR-BD-05) ----------

@router.post("/scenarios", response_model=schemas.QuoteScenarioRead, status_code=201)
def create_scenario(data: schemas.QuoteScenarioCreate, db: Session = Depends(get_db)):
    if not service.get_opportunity(db, data.opportunity_id):
        raise HTTPException(status_code=422, detail="Unknown opportunity_id")
    return service.create_scenario(db, data)


@router.get(
    "/opportunities/{opportunity_id}/scenarios",
    response_model=list[schemas.QuoteScenarioRead],
)
def list_scenarios(opportunity_id: str, db: Session = Depends(get_db)):
    return service.list_scenarios_for_opportunity(db, opportunity_id)


@router.get("/scenarios/{scenario_id}", response_model=schemas.QuoteScenarioRead)
def get_scenario(scenario_id: str, db: Session = Depends(get_db)):
    obj = service.get_scenario(db, scenario_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return obj


@router.post(
    "/scenarios/{scenario_id}/line-items",
    response_model=schemas.CostLineItemRead,
    status_code=201,
)
def add_line_item(
    scenario_id: str, data: schemas.CostLineItemCreate, db: Session = Depends(get_db)
):
    if not service.get_scenario(db, scenario_id):
        raise HTTPException(status_code=404, detail="Scenario not found")
    try:
       return service.add_line_item(db, scenario_id, data)
    except ValueError as e:
       raise HTTPException(status_code=404, detail=str(e))

# ---------- Computed output views (FR-BD-02, FR-BD-03, FR-BD-04) ----------
# Both views are always available regardless of the scenario's stored
# output_type -- FR-BD-04 requires margin shown "on both output views".

@router.get("/scenarios/{scenario_id}/quote-view", response_model=schemas.QuoteView)
def get_quote_view(scenario_id: str, db: Session = Depends(get_db)):
    scenario = service.get_scenario(db, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return service.compute_quote_view(scenario)


@router.get("/scenarios/{scenario_id}/tender-view", response_model=schemas.TenderView)
def get_tender_view(scenario_id: str, db: Session = Depends(get_db)):
    scenario = service.get_scenario(db, scenario_id)
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return service.compute_tender_view(scenario)
