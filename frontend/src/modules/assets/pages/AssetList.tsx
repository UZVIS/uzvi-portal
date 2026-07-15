import { useEffect, useState } from "react";
import { getAssets } from "../services/assetService";
import type { Asset } from "../types/asset";

function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    try {
      const data = await getAssets();
      setAssets(data);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div>
      <h1>Asset List</h1>

      <table border={1} cellPadding={10}>
        <thead>
          <tr>
            <th>Asset ID</th>
            <th>Tag</th>
            <th>Type</th>
            <th>Purchase Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {assets.map((asset) => (
            <tr key={asset.asset_id}>
              <td>{asset.asset_id}</td>
              <td>{asset.tag}</td>
              <td>{asset.asset_type}</td>
              <td>{asset.purchase_date}</td>
              <td>{asset.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AssetList;