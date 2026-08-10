import { useEffect, useState } from "react";

import {
    getLibraryItems,
} from "../services/quoteService";

import type {
    LibraryItem,
    CostLineItem,
} from "../types/quote";

interface Props {
    isOpen: boolean;
    initialData?: CostLineItem | null;
    onClose: () => void;
    onSave: (data: {
        description: string;
        vendor_cost: number;
        internal_cost: number;
        quantity: number;
        cohort?: string;
        library_item_id?: string;
    }) => void;
}

export default function AddLineItemDialog({
    isOpen,
    initialData,
    onClose,
    onSave,
}: Props) {
    const [description, setDescription] = useState("");
    const [vendorCost, setVendorCost] = useState(0);
    const [internalCost, setInternalCost] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [cohort, setCohort] = useState("");
    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
    const [libraryItemId, setLibraryItemId] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        if (initialData) {
            setDescription(initialData.description);
            setVendorCost(initialData.vendor_cost);
            setInternalCost(initialData.internal_cost);
            setQuantity(initialData.quantity);
            setCohort(initialData.cohort ?? "");
            setLibraryItemId(initialData.library_item_id ?? "");
        } else {
            setDescription("");
            setVendorCost(0);
            setInternalCost(0);
            setQuantity(1);
            setCohort("");
            setLibraryItemId("");
        }
    }, [isOpen, initialData]);

   useEffect(() => {
    if (!isOpen) return;

    async function loadLibrary() {
        try {
            const items = await getLibraryItems();

            console.log("Library items:", items);

            setLibraryItems(items);
        } catch (error) {
            console.error("Failed to load library items:", error);
        }
    }

    loadLibrary();
}, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="dialog-overlay">
            <div className="dialog">
                <h2 className="dialog-title">
                    {initialData ? "Edit Line Item" : "Add Line Item"}
                </h2>

                <div className="dialog-form-group">
                    <label>Library Item</label>
                    <select
                        className="dialog-input"
                        value={libraryItemId}
                        onChange={(e) => {
                            const id = e.target.value;
                            setLibraryItemId(id);

                            const item = libraryItems.find(
                                (x) => x.item_id === id
                            );
                            if (!item) return;

                            setDescription(item.name);

                            if (item.cost_component === "vendor") {
                                setVendorCost(item.unit_cost);
                                setInternalCost(0);
                            } else {
                                setInternalCost(item.unit_cost);
                                setVendorCost(0);
                            }
                        }}
                    >
                        <option value="">Select Library Item</option>
                        {libraryItems.map((item) => (
                            <option key={item.item_id} value={item.item_id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="dialog-form-group">
                    <label>Description</label>
                    <input
                        className="dialog-input"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>

                <div className="dialog-row">
                    <div className="dialog-form-group">
                        <label>Vendor Cost</label>
                        <input
                            className="dialog-input"
                            type="number"
                            value={vendorCost}
                            onChange={(e) => setVendorCost(Number(e.target.value))}
                        />
                    </div>

                    <div className="dialog-form-group">
                        <label>Internal Cost</label>
                        <input
                            className="dialog-input"
                            type="number"
                            value={internalCost}
                            onChange={(e) => setInternalCost(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="dialog-row">
                    <div className="dialog-form-group">
                        <label>Quantity</label>
                        <input
                            className="dialog-input"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                    </div>

                    <div className="dialog-form-group">
                        <label>Cohort</label>
                        <input
                            className="dialog-input"
                            value={cohort}
                            onChange={(e) => setCohort(e.target.value)}
                        />
                    </div>
                </div>

                <div className="dialog-actions">
                    <button className="dialog-cancel-btn" onClick={onClose}>
                        Cancel
                    </button>

                    <button
                        className="dialog-save-btn"
                        onClick={() =>
                            onSave({
                                description,
                                vendor_cost: vendorCost,
                                internal_cost: internalCost,
                                quantity,
                                cohort,
                                library_item_id: libraryItemId || undefined,
                            })
                        }
                    >
                        {initialData ? "Save Changes" : "Save Line Item"}
                    </button>
                </div>
            </div>
        </div>
    );
}