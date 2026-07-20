import { useEffect, useState } from "react";
import {
  Laptop,
  Monitor,
  Keyboard,
  Mouse,
  Armchair,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import "./../styles/table.css";

import { getAllAssets } from "../services/assetService";
import type { Asset } from "../types/asset";
import type { AssetFormData } from "./AssetForm";
function getAssetIcon(type: string) {
  switch (type) {
    case "Laptop":
      return Laptop;

    case "Monitor":
      return Monitor;

    case "Keyboard":
      return Keyboard;

    case "Mouse":
      return Mouse;

    case "Chair":
      return Armchair;

    default:
      return Laptop;
  }
}

interface AssetTableProps {
    reload: boolean;
    onEdit: (asset: AssetFormData) => void;
    onDelete: (assetId: string) => void;
}

export default function AssetTable({
    reload,
    onEdit,
    onDelete,
}: AssetTableProps) {
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    loadAssets();
  }, [reload]);

  async function loadAssets() {
    try {
      const data = await getAllAssets();
      setAssets(data);
    } catch (error) {
      console.error("Failed to load assets:", error);
    }
  }

  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Asset ID</th>
            <th>Tag</th>
            <th>Type</th>
            <th>Purchase Date</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {assets.map((asset) => {
            const Icon = getAssetIcon(asset.asset_type);

            return (
              <tr key={asset.asset_id}>
                <td>{asset.asset_id}</td>

                <td>{asset.tag}</td>

                <td>
                  <div className="asset-info">
                    <div className="asset-icon">
                      <Icon size={18} />
                    </div>

                    <span>{asset.asset_type}</span>
                  </div>
                </td>

                <td>{asset.purchase_date}</td>

                <td>
                  <span
                    className={`status ${asset.status
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {asset.status}
                  </span>
                </td>

                {/* We'll integrate this later */}
                <td>-</td>

                <td>
                  <div className="actions">
                    <button>
                      <Eye size={12} />
                    </button>

                    <button
    onClick={() =>
        onEdit({
            id: asset.asset_id,
            tag: asset.tag,
            type: asset.asset_type as AssetFormData["type"],
            status: asset.status as AssetFormData["status"],
            purchaseDate: asset.purchase_date,
            
        })
    }
>
    <Pencil size={12} />
</button>

<button onClick={() => onDelete(asset.asset_id)}><Trash2 size={12} />
</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="table-pagination">
        <span>
          Showing {assets.length} of {assets.length} assets
        </span>

        <div className="page-buttons">
          <button className="page-btn">‹</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">›</button>
        </div>

        <select className="page-size-select">
          <option>5 / page</option>
          <option>10 / page</option>
          <option>25 / page</option>
        </select>
      </div>
    </div>
  );
}