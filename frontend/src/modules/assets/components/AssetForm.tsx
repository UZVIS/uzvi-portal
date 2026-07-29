import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { X, Boxes } from "lucide-react";

import "../styles/form.css";
import type { AssetStatus } from "../types/asset";

export type AssetType =
    | "Laptop"
    | "Desktop"
    | "Monitor"
    | "Mouse"
    | "Keyboard";

export interface AssetFormData {
    id: string;
    tag: string;
    type: AssetType | "";
    status: AssetStatus | "";
    purchaseDate: string;
}

type AssetFormErrors = Partial<Record<keyof AssetFormData, string>>;

export const emptyAssetForm: AssetFormData = {
    id: "",
    tag: "",
    type: "",
    status: "",
    purchaseDate: "",
};

interface AssetFormProps {
    isOpen: boolean;
    mode: "add" | "edit";
    initialData?: AssetFormData;
    onClose: () => void;
    onSave: (data: AssetFormData) => void;
    readOnly?: boolean;
}

export default function AssetForm({
    isOpen,
    mode,
    initialData,
    onClose,
    onSave,
    readOnly = false,
}: AssetFormProps) {

    const [form, setForm] = useState<AssetFormData>(
        initialData ?? emptyAssetForm
    );

    const [errors, setErrors] =
        useState<AssetFormErrors>({});

    useEffect(() => {
        setForm(initialData ?? emptyAssetForm);
        setErrors({});
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const isEdit = mode === "edit";

    const handleChange =
        (field: keyof AssetFormData) =>
        (
            e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
        ) => {

            const value = e.target.value;

            setForm(prev => ({
                ...prev,
                [field]: value,
            }));

            if (errors[field]) {
                setErrors(prev => ({
                    ...prev,
                    [field]: undefined,
                }));
            }
        };

    const validate = () => {

        const next: AssetFormErrors = {};

        if (!form.id.trim())
            next.id = "Asset ID is required";

        if (!form.tag.trim())
            next.tag = "Tag is required";

        if (!form.type)
            next.type = "Select Asset Type";

        if (!form.status)
            next.status = "Select Status";

        if (!form.purchaseDate)
            next.purchaseDate = "Purchase Date is required";

        setErrors(next);

        return Object.keys(next).length === 0;
    };

    const handleSave = () => {

        if (readOnly) return;

        if (!validate()) return;

        onSave(form);
    };

    const handleOverlayClick = (
        e: React.MouseEvent<HTMLDivElement>
    ) => {

        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (

        <div
            className="asset-form-overlay"
            onMouseDown={handleOverlayClick}
        >

            <div className="asset-form-modal">

                {/* Header */}

                <div className="asset-form-header">

                    <div className="asset-form-header-left">

                        <div className="asset-form-icon">
                            <Boxes size={20} />
                        </div>

                        <div>

                            <h2 className="asset-form-title">

                                {readOnly
                                    ? "View Asset"
                                    : isEdit
                                    ? "Edit Asset"
                                    : "Add New Asset"}

                            </h2>

                            <p className="asset-form-subtitle">

                                {readOnly
                                    ? "View asset information"
                                    : isEdit
                                    ? "Update the details of this asset"
                                    : "Enter the details of the new asset"}

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

                {/* Body */}

                <div className="asset-form-body">

                    <div className="asset-form-grid">

                        {/* Asset ID */}

                        <div className="asset-form-field">

                            <label className="asset-form-label">
                                Asset ID
                                <span className="required">*</span>
                            </label>

                            <input
                                className={`asset-form-input ${errors.id ? "input-error" : ""}`}
                                placeholder="AST001"
                                value={form.id}
                                onChange={handleChange("id")}
                                disabled={readOnly || isEdit}
                            />

                            {errors.id &&
                                <p className="asset-form-error">
                                    {errors.id}
                                </p>}
                        </div>

                        {/* Tag */}

                        <div className="asset-form-field">

                            <label className="asset-form-label">
                                Tag
                                <span className="required">*</span>
                            </label>

                            <input
                                className={`asset-form-input ${errors.tag ? "input-error" : ""}`}
                                placeholder="LT001"
                                value={form.tag}
                                onChange={handleChange("tag")}
                                disabled={readOnly}
                            />

                            {errors.tag &&
                                <p className="asset-form-error">
                                    {errors.tag}
                                </p>}
                        </div>

                        {/* Asset Type */}

                        <div className="asset-form-field">

                            <label className="asset-form-label">
                                Asset Type
                                <span className="required">*</span>
                            </label>

                            <select
                                className={`asset-form-select ${errors.type ? "input-error" : ""}`}
                                value={form.type}
                                onChange={handleChange("type")}
                                disabled={readOnly}
                            >

                                <option value="">Select Type</option>
                                <option value="Laptop">Laptop</option>
                                <option value="Desktop">Desktop</option>
                                <option value="Monitor">Monitor</option>
                                <option value="Keyboard">Keyboard</option>
                                <option value="Mouse">Mouse</option>

                            </select>

                            {errors.type &&
                                <p className="asset-form-error">
                                    {errors.type}
                                </p>}
                        </div>

                        {/* Status */}

                        <div className="asset-form-field">

                            <label className="asset-form-label">
                                Status
                                <span className="required">*</span>
                            </label>

                            <select
                                className={`asset-form-select ${errors.status ? "input-error" : ""}`}
                                value={form.status}
                                onChange={handleChange("status")}
                                disabled={readOnly}
                            >

                                <option value="">Select Status</option>
                                <option value="In Stock">In Stock</option>
                                <option value="Assigned">Assigned</option>
                                <option value="Under Repair">Under Repair</option>
                                <option value="Retired">Retired</option>

                            </select>

                            {errors.status &&
                                <p className="asset-form-error">
                                    {errors.status}
                                </p>}
                        </div>

                        {/* Purchase Date */}

                        <div className="asset-form-field full-span">

                            <label className="asset-form-label">
                                Purchase Date
                                <span className="required">*</span>
                            </label>

                            <input
                                type="date"
                                className={`asset-form-input ${errors.purchaseDate ? "input-error" : ""}`}
                                value={form.purchaseDate}
                                onChange={handleChange("purchaseDate")}
                                disabled={readOnly}
                            />

                            {errors.purchaseDate &&
                                <p className="asset-form-error">
                                    {errors.purchaseDate}
                                </p>}
                        </div>

                    </div>

                </div>

                {/* Footer */}

                <div className="asset-form-footer">

                    <button
                        className="asset-form-cancel-btn"
                        onClick={onClose}
                    >
                        {readOnly ? "Close" : "Cancel"}
                    </button>

                    {!readOnly && (
                        <button
                            className="asset-form-save-btn"
                            onClick={handleSave}
                        >
                            {isEdit
                                ? "Save Changes"
                                : "Save Asset"}
                        </button>
                    )}

                </div>

            </div>

        </div>

    );
}