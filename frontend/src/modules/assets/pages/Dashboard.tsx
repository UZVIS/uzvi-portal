import { useState } from "react";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import DashboardCards from "../components/DashboardCards";
import SearchBar from "../components/SearchBar";
import AssetTable from "../components/AssetTable";
import AssetForm, {
    emptyAssetForm,
    type AssetFormData,
} from "../components/AssetForm";
import DeleteDialog from "../components/DeleteDialog";
import AssignDialog from "../components/AssignDialog";
import {
    createAsset,
    updateAsset,
    deleteAsset,
} from "../services/assetService";

import type {
    AssetCreate,
    AssetStatus,
} from "../types/asset";

import "../styles/dashboard.css";

import { toast } from "sonner";
import { assignAsset } from "../services/assetService";
export default function Dashboard() {

    const [showAssetForm, setShowAssetForm] = useState(false);

    const [reloadAssets, setReloadAssets] = useState(false);

    const [formMode, setFormMode] =
        useState<"add" | "edit">("add");

    const [viewMode, setViewMode] =
        useState(false);

    const [selectedAsset, setSelectedAsset] =
        useState<AssetFormData>(emptyAssetForm);

    const [showDeleteDialog, setShowDeleteDialog] =
        useState(false);

    const [selectedAssetId, setSelectedAssetId] =
        useState("");
    
    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState("");

    const [typeFilter, setTypeFilter] = useState("");
    const [showAssignDialog, setShowAssignDialog] = useState(false);

    const [assignAssetId, setAssignAssetId] = useState("");

    async function handleSave(data: AssetFormData) {

        const payload: AssetCreate = {
            asset_id: data.id,
            tag: data.tag,
            asset_type: data.type as string,
            purchase_date: data.purchaseDate,
            status: data.status as AssetStatus,
        };

        try {

            if (formMode === "add") {

                await createAsset(payload);

                toast.success(
                    `Asset ${data.id} added successfully.`
                );

            } else {

                await updateAsset(data.id, payload);

                toast.success(
                    `Asset ${data.id} updated successfully.`
                );

            }

            setReloadAssets(prev => !prev);

            setShowAssetForm(false);

            setViewMode(false);

        } catch (error: unknown) {

            console.error(error);

            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error("Failed to save asset.");
            }

        }

    }

    return (

        <div className="dashboard-layout">

            <Sidebar />

            <div className="dashboard-page">

                <Header />

                <main className="dashboard-body">

                    <DashboardCards />

                    <SearchBar
                        onAddAsset={() => {

                            setFormMode("add");

                            setViewMode(false);

                            setSelectedAsset(emptyAssetForm);

                            setShowAssetForm(true);

                        }}
                        search={search}
                        onSearchChange={setSearch}

                        status={statusFilter}
                        onStatusChange={setStatusFilter}

                        type={typeFilter}
                        onTypeChange={setTypeFilter}

                    />

                    <AssetTable
                        reload={reloadAssets}
                        search={search}
                        status={statusFilter}
                        type={typeFilter}

                        onView={(asset) => {

                            setSelectedAsset(asset);

                            setFormMode("edit");

                            setViewMode(true);

                            setShowAssetForm(true);

                        }}

                        onEdit={(asset) => {

                            setSelectedAsset(asset);

                            setFormMode("edit");

                            setViewMode(false);

                            setShowAssetForm(true);

                        }}
                        onAssign={(assetId) => {

                        setAssignAssetId(assetId);

                       setShowAssignDialog(true);

                      }}

                        onDelete={(assetId) => {

                            setSelectedAssetId(assetId);

                            setShowDeleteDialog(true);

                        }}

                    />

                    <AssetForm
                        isOpen={showAssetForm}
                        mode={formMode}
                        readOnly={viewMode}
                        initialData={selectedAsset}
                        onClose={() => {

                            setShowAssetForm(false);

                            setViewMode(false);

                        }}
                        onSave={handleSave}
                    />

                    <DeleteDialog
                        isOpen={showDeleteDialog}
                        assetId={selectedAssetId}
                        onClose={() =>
                            setShowDeleteDialog(false)
                        }
                        onConfirm={async () => {

                            try {

                                await deleteAsset(
                                    selectedAssetId
                                );

                                toast.success(
                                    `Asset ${selectedAssetId} deleted successfully.`
                                );

                                setReloadAssets(prev => !prev);

                                setShowDeleteDialog(false);

                            } catch (error: unknown) {

                                console.error(error);

                                if (error instanceof Error) {
                                    toast.error(error.message);
                                } else {
                                    toast.error(
                                        "Something went wrong."
                                    );
                                }

                            }

                        }}


                    />
         <AssignDialog
    isOpen={showAssignDialog}
    assetId={assignAssetId}
    onClose={() => setShowAssignDialog(false)}
     onAssign={async (data) => {

    try {

        await assignAsset({

            assignment_id: `ASN${Date.now()}`,

            asset_id: assignAssetId,

            employee_id: data.employeeId,

            assigned_date: data.assignedDate,

            returned_date: null,

            remarks: data.remarks,

        });

        toast.success("Asset assigned successfully.");

        setShowAssignDialog(false);

        setReloadAssets(prev => !prev);

    } catch (error) {

        if (error instanceof Error) {
            toast.error(error.message);
        } else {
            toast.error("Failed to assign asset.");
        }

    }

}}
/>

                </main>

            </div>

        </div>

    );

}