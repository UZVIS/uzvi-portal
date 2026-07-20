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
import { deleteAsset } from "../services/assetService";
import { createAsset, updateAsset } from "../services/assetService";

import type {
    AssetStatus,
    AssetCreate,
} from "../types/asset";

import "../styles/dashboard.css";
import { toast } from "sonner";
export default function Dashboard() {

    const [showAssetForm, setShowAssetForm] = useState(false);

    const [reloadAssets, setReloadAssets] = useState(false);

    const [formMode, setFormMode] = useState<"add" | "edit">("add");

    const [selectedAsset, setSelectedAsset] =
        useState<AssetFormData>(emptyAssetForm);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const [selectedAssetId, setSelectedAssetId] = useState("");
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

            toast.success(`Asset ${data.id} added successfully.`);

        } else {

            await updateAsset(data.id, payload);

            toast.success(`Asset ${data.id} updated successfully.`);

        }

        setReloadAssets(prev => !prev);

        setShowAssetForm(false);

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

                            setSelectedAsset(emptyAssetForm);

                            setShowAssetForm(true);

                        }}
                    />

                    <AssetTable
    reload={reloadAssets}
    onEdit={(asset) => {

        setFormMode("edit");
        setSelectedAsset(asset);
        setShowAssetForm(true);

    }}
    onDelete={(assetId) => {

        setSelectedAssetId(assetId);
        setShowDeleteDialog(true);

    }}
/>

                    <AssetForm
                        isOpen={showAssetForm}
                        mode={formMode}
                        initialData={selectedAsset}
                        onClose={() => setShowAssetForm(false)}
                        onSave={handleSave}
                    />

                    <DeleteDialog
    isOpen={showDeleteDialog}
    assetId={selectedAssetId}
    onClose={() => setShowDeleteDialog(false)}
    onConfirm={async () => {

        try {

            await deleteAsset(selectedAssetId);

            setReloadAssets(prev => !prev);

            setShowDeleteDialog(false);

        } catch (error: unknown) {

    console.error(error);

    if (error instanceof Error) {
        toast.error(error.message);
    } else {
        toast.error("Something went wrong");
    }

}

    }}
/>

                </main>

            </div>

        </div>

    );

}