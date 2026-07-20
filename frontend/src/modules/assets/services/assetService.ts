import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../../../api/client";
import type { AssetAssignmentCreate } from "../types/asset";
import type {
  Asset,
  AssetCreate,
  AssetAssignment,
  AssetReturn,
  InventorySummary,
} from "../types/asset";

const BASE_URL = "/v1/assets";

// ====================================
// Assets
// ====================================

export async function getAllAssets(): Promise<Asset[]> {
  return apiGet(`${BASE_URL}/`);
}

export async function getAssetById(
  assetId: string
): Promise<Asset> {
  return apiGet(`${BASE_URL}/${assetId}`);
}

export async function createAsset(
  asset: AssetCreate
): Promise<Asset> {
  return apiPost(`${BASE_URL}/`, asset);
}

export async function updateAsset(
  assetId: string,
  asset: AssetCreate
): Promise<Asset> {
  return apiPut(`${BASE_URL}/${assetId}`, asset);
}

export async function deleteAsset(
  assetId: string
) {
  return apiDelete(`${BASE_URL}/${assetId}`);
}

// ====================================
// Inventory
// ====================================

export async function getInventorySummary(): Promise<InventorySummary> {
  return apiGet(`${BASE_URL}/summary`);
}

export async function getInventoryByType() {
  return apiGet(`${BASE_URL}/summary/type`);
}

// ====================================
// Assignments
// ====================================

export async function getAssignments(): Promise<AssetAssignment[]> {
  return apiGet(`${BASE_URL}/assignments`);
}

export async function getAssignmentById(
  assignmentId: string
): Promise<AssetAssignment> {
  return apiGet(
    `${BASE_URL}/assignments/${assignmentId}`
  );
}

export async function assignAsset(
  assignment: AssetAssignmentCreate
): Promise<AssetAssignment> {
  return apiPost(`${BASE_URL}/assign`, assignment);
}

export async function returnAsset(
  assignmentId: string,
  data: AssetReturn
): Promise<AssetAssignment> {
  return apiPut(
    `${BASE_URL}/return/${assignmentId}`,
    data
  );
}

// ====================================
// Employee Assets
// ====================================

export async function getEmployeeAssets(
  employeeId: string
): Promise<Asset[]> {
  return apiGet(
    `${BASE_URL}/employee/${employeeId}`
  );
}

// ====================================
// Asset History
// ====================================

export async function getAssetHistory(
  assetId: string
): Promise<AssetAssignment[]> {
  return apiGet(
    `${BASE_URL}/${assetId}/history`
  );
}