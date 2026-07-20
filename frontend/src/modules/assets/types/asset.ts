export type AssetStatus =
  | "In Stock"
  | "Assigned"
  | "Under Repair"
  | "Retired";

export interface Asset {
  asset_id: string;
  tag: string;
  asset_type: string;
  purchase_date: string;
  status: AssetStatus;
}

export interface AssetCreate {
  asset_id: string;
  tag: string;
  asset_type: string;
  purchase_date: string;
  status: AssetStatus;
}

export interface AssetAssignment {
  assignment_id: string;
  asset_id: string;
  employee_id: string;
  assigned_date: string;
  returned_date: string | null;
  remarks: string | null;
}

export interface AssetReturn {
  returned_date: string;
  remarks?: string;
}

export interface InventorySummary {
  total_assets: number;
  in_stock_assets: number;
  assigned_assets: number;
  under_repair_assets: number;
  retired_assets: number;
}