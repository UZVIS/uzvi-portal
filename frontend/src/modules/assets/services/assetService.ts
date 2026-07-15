import { apiGet } from "../../../api/client";

import type {
  Asset,
} from "../types/asset";

export async function getAssets(): Promise<Asset[]> {
  return apiGet("/v1/assets");
}