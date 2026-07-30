export interface Opportunity {
    opportunity_id: string;
    name: string;
    client: string;
}

export interface OpportunityCreate {
    name: string;
    client: string;
}

export interface LibraryItem {
    item_id: string;
    name: string;
    unit_cost: number;
    category?: string;
    cost_component: "vendor" | "internal";
}

export interface CostLineItem {
    line_item_id: string;
    scenario_id: string;
    library_item_id?: string | null;

    description: string;
    vendor_cost: number;
    internal_cost: number;
    quantity: number;
    cohort?: string | null;
}

export interface QuoteScenario {
    scenario_id: string;
    opportunity_id: string;
    created_by: string;
    name: string;
    output_type: "quote" | "tender";
    target_margin: number;
    created_at: string;

    line_items: CostLineItem[];
}

export interface CostLineItem {
    line_item_id: string;
    scenario_id: string;
    description: string;
    vendor_cost: number;
    internal_cost: number;
    quantity: number;
    cohort?: string | null;
    library_item_id?: string | null;
}

export interface QuoteViewLine {
    line_item_id: string;
    description: string;
    quantity: number;
    cohort?: string | null;
    unit_price: number;
    line_total: number;
}

export interface QuoteView {
    scenario_id: string;
    output_type: "quote";
    target_margin: number;
    lines: QuoteViewLine[];
    total_cost: number;
    selling_price: number;
    resulting_margin: number;
}

export interface TenderViewLine {
    line_item_id: string;
    description: string;
    quantity: number;
    cohort?: string | null;
    vendor_unit_cost: number;
    internal_unit_cost: number;
    vendor_line_total: number;
    internal_line_total: number;
    selling_unit_price: number;
    selling_line_total: number;
}

export interface TenderView {
    scenario_id: string;
    output_type: "tender";
    lines: TenderViewLine[];
    total_vendor_cost: number;
    total_internal_cost: number;
    total_cost: number;
    selling_price: number;
    resulting_margin: number;
}

