import { useEffect, useState } from "react";
import {
    Laptop,
    Monitor,
    Keyboard,
    Mouse,
    Armchair,
} from "lucide-react";

import { getEmployeeAssets } from "../services/assetService";
import type { Asset } from "../types/asset";

import "../styles/table.css";

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

interface EmployeeAssetTableProps {
    employeeId: string;
}

export default function EmployeeAssetTable({
    employeeId,
}: EmployeeAssetTableProps) {

    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        loadAssets();
    }, [employeeId]);

    async function loadAssets() {
        try {
            const data = await getEmployeeAssets(employeeId);
            setAssets(data);
        } catch (error) {
            console.error(error);
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
                    </tr>
                </thead>

                <tbody>

                    {assets.length === 0 ? (

                        <tr>
                            <td
                                colSpan={5}
                                style={{
                                    textAlign: "center",
                                    padding: "30px",
                                }}
                            >
                                No assets assigned.
                            </td>
                        </tr>

                    ) : (

                        assets.map((asset) => {

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

                                            {asset.asset_type}
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

                                </tr>

                            );

                        })

                    )}

                </tbody>

            </table>

        </div>
    );
}