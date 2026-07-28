import { useEffect, useState } from "react";

import {
    getLibraryItems,
} from "../services/quoteService";

import type {
    LibraryItem,
} from "../types/quote";

interface Props {
    isOpen: boolean;
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
    onClose,
    onSave,
}: Props) {

    const [description, setDescription] = useState("");

    const [vendorCost, setVendorCost] = useState(0);

    const [internalCost, setInternalCost] = useState(0);

    const [quantity, setQuantity] = useState(1);

    const [cohort, setCohort] = useState("");
    
    const [libraryItems, setLibraryItems] =
    useState<LibraryItem[]>([]);

    const [libraryItemId, setLibraryItemId] =
    useState("");
    useEffect(() => {

        if (isOpen) {

            setDescription("");
            setVendorCost(0);
            setInternalCost(0);
            setQuantity(1);
            setCohort("");
            setLibraryItemId("");

        }

    }, [isOpen]);

    useEffect(() => {

    async function loadLibrary() {

        try {

            const items =
                await getLibraryItems();

            setLibraryItems(items);

        } catch {

            console.error(
                "Failed to load library items."
            );

        }

    }

    loadLibrary();

}, []);

    if (!isOpen) return null;

    return (

        <div className="dialog-overlay">

            <div className="dialog">

                <h2>Add Line Item</h2>

                <div className="form-group">

    <label>Library Item</label>

    <select
        value={libraryItemId}
        onChange={(e) => {

            const id = e.target.value;

            setLibraryItemId(id);

            const item = libraryItems.find(
                x => x.item_id === id
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

        <option value="">
            Select Library Item
        </option>

        {libraryItems.map(item => (

            <option
                key={item.item_id}
                value={item.item_id}
            >
                {item.name}
            </option>

        ))}

    </select>

</div>

                <div className="form-group">

                    <label>Description</label>

                    <input
                        value={description}
                        onChange={(e) =>
                            setDescription(e.target.value)
                        }
                    />

                </div>

                <div className="form-group">

                    <label>Vendor Cost</label>

                    <input
                        type="number"
                        value={vendorCost}
                        onChange={(e) =>
                            setVendorCost(Number(e.target.value))
                        }
                    />

                </div>

                <div className="form-group">

                    <label>Internal Cost</label>

                    <input
                        type="number"
                        value={internalCost}
                        onChange={(e) =>
                            setInternalCost(Number(e.target.value))
                        }
                    />

                </div>

                <div className="form-group">

                    <label>Quantity</label>

                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) =>
                            setQuantity(Number(e.target.value))
                        }
                    />

                </div>

                <div className="form-group">

                    <label>Cohort</label>

                    <input
                        value={cohort}
                        onChange={(e) =>
                            setCohort(e.target.value)
                        }
                    />

                </div>

                <div className="dialog-actions">

                    <button
                        className="btn-secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="add-btn"
                        onClick={() =>
                            onSave({

    description,

    vendor_cost: vendorCost,

    internal_cost: internalCost,

    quantity,

    cohort,

    library_item_id:
        libraryItemId || undefined,

})
                        }
                    >
                        Save Line Item
                    </button>

                </div>

            </div>

        </div>

    );

} 