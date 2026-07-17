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

const assets = [
  { id: "AST001", tag: "LT001", type: "Laptop", purchaseDate: "12 Jan 2026", status: "Available", assigned: "-", icon: Laptop },
  { id: "AST002", tag: "MN002", type: "Monitor", purchaseDate: "05 Feb 2026", status: "Assigned", assigned: "EMP001 - Revathi K.", icon: Monitor },
  { id: "AST003", tag: "KB003", type: "Keyboard", purchaseDate: "17 Feb 2026", status: "Available", assigned: "-", icon: Keyboard },
  { id: "AST004", tag: "MS004", type: "Mouse", purchaseDate: "20 Feb 2026", status: "Assigned", assigned: "EMP002 - Rahul S.", icon: Mouse },
  { id: "AST005", tag: "CH005", type: "Chair", purchaseDate: "28 Feb 2026", status: "Retired", assigned: "-", icon: Armchair },
];

export default function AssetTable() {
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
            const Icon = asset.icon;
            return (
              <tr key={asset.id}>
                <td>{asset.id}</td>
                <td>{asset.tag}</td>
                <td>
                  <div className="asset-info">
                    <div className="asset-icon">
                      <Icon size={18} />
                    </div>
                    <span>{asset.type}</span>
                  </div>
                </td>
                <td>{asset.purchaseDate}</td>
                <td>
                  <span className={`status ${asset.status.toLowerCase()}`}>
                    {asset.status}
                  </span>
                </td>
                <td>{asset.assigned}</td>
                <td>
                  <div className="actions">
                    <button><Eye size={12} /></button>
                    <button><Pencil size={12} /></button>
                    <button><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="table-pagination">
        <span>Showing 1 to 5 of 230 assets</span>
        <div className="page-buttons">
          <button className="page-btn">‹</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">3</button>
          <span>…</span>
          <button className="page-btn">46</button>
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