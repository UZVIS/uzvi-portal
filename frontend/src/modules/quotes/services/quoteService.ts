import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from "../../../api/client";

import type {
    Opportunity,
    OpportunityCreate,
    QuoteScenario,
    QuoteView,
    TenderView,
    CostLineItem,
    LibraryItem,
} from "../types/quote";


const BASE_URL = "/v1/quotes";

// ======================================
// Opportunities
// ======================================

export async function getOpportunities(): Promise<Opportunity[]> {
  return apiGet(`${BASE_URL}/opportunities`);
}

export async function getOpportunityById(
  opportunityId: string
): Promise<Opportunity> {
  return apiGet(
    `${BASE_URL}/opportunities/${opportunityId}`
  );
}

export async function createOpportunity(
  opportunity: OpportunityCreate
): Promise<Opportunity> {
  return apiPost(
    `${BASE_URL}/opportunities`,
    opportunity
  );
}

// ======================================
// Scenarios
// ======================================

export interface ScenarioCreate {
  opportunity_id: string;
  created_by: string;
  name: string;
  output_type: "quote" | "tender";
  target_margin: number;
}

export async function createScenario(
  data: ScenarioCreate
): Promise<QuoteScenario> {
  return apiPost(
    `${BASE_URL}/scenarios`,
    data
  );
}

export async function getScenarios(
  opportunityId: string
): Promise<QuoteScenario[]> {
  return apiGet(
    `${BASE_URL}/opportunities/${opportunityId}/scenarios`
  );
}
// ======================================
// Get Scenario By Id
// ======================================

export async function getScenarioById(
  scenarioId: string
): Promise<QuoteScenario> {
  return apiGet(
    `${BASE_URL}/scenarios/${scenarioId}`
  );
}

export async function deleteScenario(
  scenarioId: string
) {
  return apiDelete(
    `${BASE_URL}/scenarios/${scenarioId}`
  );
}


export interface LineItemCreate {
    description: string;
    vendor_cost: number;
    internal_cost: number;
    quantity: number;
    cohort?: string;
    library_item_id?: string;
}
export interface ComparisonResult {
    scenario_id: string;
    scenario_name: string;
    output_type: "quote" | "tender";
    target_margin: number;
    total_cost: number;
    selling_price: number;
    resulting_margin: number;
}

export interface ScenarioComparisonResponse {
    opportunity_id: string;
    scenarios: ComparisonResult[];
}
export async function addLineItem(
    scenarioId: string,
    data: LineItemCreate
): Promise<CostLineItem> {

    return apiPost(
        `${BASE_URL}/scenarios/${scenarioId}/line-items`,
        data
    );

}

export async function getQuoteView(
    scenarioId: string
): Promise<QuoteView> {

    return apiGet(
        `${BASE_URL}/scenarios/${scenarioId}/quote-view`
    );

}

export async function getTenderView(
    scenarioId: string
): Promise<TenderView> {

    return apiGet(
        `${BASE_URL}/scenarios/${scenarioId}/tender-view`
    );

}

export async function getLibraryItems(): Promise<LibraryItem[]> {

    return apiGet(
        `${BASE_URL}/library`
    );

}

export async function updateScenario(
    scenarioId: string,
    data: {
        name: string;
        output_type: "quote" | "tender";
        target_margin: number;
    }
): Promise<QuoteScenario> {

    return apiPut(
        `${BASE_URL}/scenarios/${scenarioId}`,
        data
    );

}

export async function updateLineItem(
    lineItemId: string,
    data: LineItemCreate
) {
    return apiPut(
        `${BASE_URL}/line-items/${lineItemId}`,
        data
    );
}

export async function deleteLineItem(
    lineItemId: string
) {
    return apiDelete(
        `${BASE_URL}/line-items/${lineItemId}`
    );
}


// ======================================
// Scenario Comparison — FR-BD-05
// ======================================

export interface ScenarioComparisonResult {
  opportunity_id: string;

  scenarios: {
    scenario_id: string;
    scenario_name: string;
    output_type: "quote" | "tender";
    target_margin: number;
    total_cost: number;
    selling_price: number;
    resulting_margin: number;
  }[];
}

export async function compareScenarios(
    opportunityId: string,
    scenarioIds: string[]
): Promise<ScenarioComparisonResponse> {
    return apiPost(
        `${BASE_URL}/opportunities/${opportunityId}/scenarios/compare`,
        scenarioIds
    );
}