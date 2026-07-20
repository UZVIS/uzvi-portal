import { useEffect, useMemo, useState } from "react";
import {
    Laptop,
    Monitor,
    Keyboard,
    Mouse,
    Armchair,
    Eye,
    Pencil,
    Trash2,
    UserPlus
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
    search: string;
    status: string;
    type: string;
    onEdit: (asset: AssetFormData) => void;
    onDelete: (assetId: string) => void;
    onView: (asset: AssetFormData) => void;
    onAssign: (assetId: string) => void;
}

export default function AssetTable({
    reload,
    search,
    status,
    type,
    onEdit,
    onDelete,
    onView,
    onAssign,
}: AssetTableProps) {

    const [assets, setAssets] = useState<Asset[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

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

    const filteredAssets = useMemo(() => {

        return assets.filter((asset) => {

            const matchesSearch =
                asset.asset_id.toLowerCase().includes(search.toLowerCase()) ||
                asset.tag.toLowerCase().includes(search.toLowerCase()) ||
                asset.asset_type.toLowerCase().includes(search.toLowerCase());

            const matchesStatus =
                status === "" ||
                asset.status === status;

            const matchesType =
                type === "" ||
                asset.asset_type === type;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesType
            );

        });

    }, [assets, search, status, type]);

    useEffect(() => {

        setCurrentPage(1);

    }, [search, status, type]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredAssets.length / pageSize)
    );

    const paginatedAssets = filteredAssets.slice(

        (currentPage - 1) * pageSize,

        currentPage * pageSize

    );

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

                    {paginatedAssets.length === 0 ? (

                        <tr>

                            <td
                                colSpan={7}
                                style={{
                                    textAlign: "center",
                                    padding: "30px",
                                }}
                            >
                                No assets found.
                            </td>

                        </tr>

                    ) : (

                        paginatedAssets.map((asset) => {

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

                                    <td>
    {asset.employee_name ?? "-"}
</td>

                                    <td>

                                        <div className="actions">

                                            <button
                                                onClick={() =>
                                                    onView({
                                                        id: asset.asset_id,
                                                        tag: asset.tag,
                                                        type: asset.asset_type as AssetFormData["type"],
                                                        status: asset.status as AssetFormData["status"],
                                                        purchaseDate: asset.purchase_date,
                                                    })
                                                }
                                            >
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

                                            {asset.status === "In Stock" && (
    <button
        title="Assign Asset"
        onClick={() => onAssign(asset.asset_id)}
    >
        <UserPlus size={12} />
    </button>
)}

                                            <button
                                                onClick={() =>
                                                    onDelete(asset.asset_id)
                                                }
                                            >
                                                <Trash2 size={12} />
                                            </button>

                                        </div>

                                    </td>

                                </tr>

                            );

                        })

                    )}

                </tbody>

            </table>

            <div className="table-pagination">

                <span>

                    Showing {paginatedAssets.length} of {filteredAssets.length} assets

                </span>

                <div className="page-buttons">

                    <button
                        className="page-btn"
                        disabled={currentPage === 1}
                        onClick={() =>
                            setCurrentPage((prev) => prev - 1)
                        }
                    >
                        ‹
                    </button>

                    <button className="page-btn active">

                        {currentPage}

                    </button>

                    <button
                        className="page-btn"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                            setCurrentPage((prev) => prev + 1)
                        }
                    >
                        ›
                    </button>

                </div>

                <select
                    className="page-size-select"
                    value={pageSize}
                    onChange={(e) => {

                        setPageSize(Number(e.target.value));

                        setCurrentPage(1);

                    }}
                >

                    <option value={5}>5 / page</option>

                    <option value={10}>10 / page</option>

                    <option value={25}>25 / page</option>

                </select>

            </div>

        </div>

    );

}