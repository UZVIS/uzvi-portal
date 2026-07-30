import { useEffect, useState } from "react";
import { Clock3, X } from "lucide-react";

import { getAssetHistory } from "../services/assetService";
import type { AssetHistory } from "../types/asset";

import "../styles/form.css";

interface Props {

    isOpen: boolean;

    assetId: string;

    onClose: () => void;

}

export default function AssetHistoryDialog({

    isOpen,

    assetId,

    onClose,

}: Props) {

    const [history, setHistory] = useState<AssetHistory[]>([]);

    useEffect(() => {

        if (!isOpen) return;

        loadHistory();

    }, [isOpen]);

    async function loadHistory() {

        try {

            const data = await getAssetHistory(assetId);

            setHistory(data);

        } catch (error) {

            console.error(error);

        }

    }

    if (!isOpen) return null;

    return (

        <div className="asset-form-overlay">

            <div className="asset-form-modal">

                <div className="asset-form-header">

                    <div className="asset-form-header-left">

                        <div className="asset-form-icon">

                            <Clock3 size={20} />

                        </div>

                        <div>

                            <h2 className="asset-form-title">

                                Asset History

                            </h2>

                            <p className="asset-form-subtitle">

                                {assetId}

                            </p>

                        </div>

                    </div>

                    <button
                        className="asset-form-close"
                        onClick={onClose}
                    >

                        <X size={20} />

                    </button>

                </div>

                <div className="asset-form-body">

                    <table className="history-table">

                        <thead>

                            <tr>

                                <th>Employee</th>

                                <th>Assigned</th>

                                <th>Returned</th>

                                <th>Remarks</th>

                            </tr>

                        </thead>

                        <tbody>

                            {history.map(item => (

                                <tr key={item.assignment_id}>

                                    <td>

                                        {item.employee_name}

                                    </td>

                                    <td>

                                        {item.assigned_date}

                                    </td>

                                    <td>

                                        {item.returned_date ?? "-"}

                                    </td>

                                    <td>

                                        {item.remarks ?? "-"}

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    );

}