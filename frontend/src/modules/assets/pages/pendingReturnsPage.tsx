import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

import ReturnDialog from "../components/ReturnDialog";

import {
    getPendingReturns,
    returnAsset,
} from "../services/assetService";

import type { PendingReturn } from "../types/asset";

import "../styles/dashboard.css";
import "../styles/table.css";

import { toast } from "sonner";

export default function PendingReturnsPage() {

    const [pendingReturns, setPendingReturns] =
        useState<PendingReturn[]>([]);

    const [showReturnDialog, setShowReturnDialog] =
        useState(false);

    const [selectedReturn, setSelectedReturn] =
        useState<PendingReturn | null>(null);

    useEffect(() => {

        loadPendingReturns();

    }, []);

    async function loadPendingReturns() {

        try {

            const data = await getPendingReturns();

            setPendingReturns(data);

        } catch (error) {

            console.error(error);

            toast.error("Failed to load pending returns.");

        }

    }

    return (

        <div className="dashboard-layout">

            <Sidebar />

            <div className="dashboard-page">

                <Header />

                <main className="dashboard-body">

                    <div className="page-header">

                        <h2>Pending Returns</h2>

                        <p>
                            Assets assigned to exited employees.
                        </p>

                    </div>

                    <div className="table-container">

                        <table className="asset-table">

                            <thead>

                                <tr>

                                    <th>Asset ID</th>

                                    <th>Tag</th>

                                    <th>Type</th>

                                    <th>Employee</th>

                                    <th>Assigned Date</th>

                                    <th>Action</th>

                                </tr>

                            </thead>

                            <tbody>

                                {pendingReturns.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan={6}
                                            style={{
                                                textAlign: "center",
                                                padding: "30px"
                                            }}
                                        >

                                            No pending returns.

                                        </td>

                                    </tr>

                                ) : (

                                    pendingReturns.map((item) => (

                                        <tr key={item.assignment_id}>

                                            <td>{item.asset_id}</td>

                                            <td>{item.tag}</td>

                                            <td>{item.asset_type}</td>

                                            <td>{item.employee_name}</td>

                                            <td>{item.assigned_date}</td>

                                            <td>

                                                <button
                                                    className="action-btn return"
                                                    onClick={() => {

                                                        setSelectedReturn(item);

                                                        setShowReturnDialog(true);

                                                    }}
                                                >

                                                    <RotateCcw size={16} />

                                                    Return

                                                </button>

                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                </main>

            </div>

            {selectedReturn && (

                <ReturnDialog

                    isOpen={showReturnDialog}

                    assignmentId={selectedReturn.assignment_id}

                    assetId={selectedReturn.asset_id}

                    employeeName={selectedReturn.employee_name}

                    onClose={() => {

                        setShowReturnDialog(false);

                    }}

                    onReturn={async (data) => {

                        try {

                            await returnAsset(

                                selectedReturn.assignment_id,

                                {

                                    returned_date: data.returnDate,

                                    remarks: data.remarks,

                                }

                            );

                            toast.success("Asset returned.");

                            setShowReturnDialog(false);

                            loadPendingReturns();

                        }

                        catch (error) {

                            console.error(error);

                            toast.error("Return failed.");

                        }

                    }}

                />

            )}

        </div>

    );

}