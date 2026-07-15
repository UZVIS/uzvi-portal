export type AssetStatus =
  | "Available"
  | "Assigned"
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

export interface InventorySummary {
  total_assets: number;
  available_assets: number;
  assigned_assets: number;
}