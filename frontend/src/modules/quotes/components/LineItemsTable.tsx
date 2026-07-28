import {
    Plus,
    Pencil,
    Trash2,
    PackageOpen,
} from "lucide-react";

import type {
    CostLineItem,
} from "../types/quote";

interface Props {
    scenarioId: string;
    lineItems: CostLineItem[];
    onAddLineItem: () => void;
}

export default function LineItemsTable({
    lineItems,
    onAddLineItem,
}: Props) {

    return (

        <div className="table-card">

            <div className="table-toolbar">

                <div className="toolbar-spacer" />

                <button
                    className="add-btn"
                    onClick={onAddLineItem}
                >
                    <Plus size={18} />
                    Add Line Item
                </button>

            </div>

            <table className="data-table">

                <thead>

                    <tr>

                        <th>Description</th>

                        <th>Vendor Cost</th>

                        <th>Internal Cost</th>

                        <th>Quantity</th>

                        <th>Cohort</th>

                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>

                    {lineItems.length === 0 ? (

                        <tr>

                            <td colSpan={6}>

                                <div className="empty-state">

                                    <div className="empty-icon">

                                        <PackageOpen size={24} />

                                    </div>

                                    <h3>
                                        No Line Items
                                    </h3>

                                    <p>
                                        Add your first cost line item.
                                    </p>

                                    <button
                                        className="add-btn"
                                        onClick={onAddLineItem}
                                    >
                                        <Plus size={18} />
                                        Add Line Item
                                    </button>

                                </div>

                            </td>

                        </tr>

                    ) : (

                        lineItems.map((item) => (

                            <tr
                                key={item.line_item_id}
                            >

                                <td>
                                    {item.description}
                                </td>

                                <td>
                                    ${item.vendor_cost.toFixed(2)}
                                </td>

                                <td>
                                    ${item.internal_cost.toFixed(2)}
                                </td>

                                <td>
                                    {item.quantity}
                                </td>

                                <td>
                                    {item.cohort || "-"}
                                </td>

                                <td className="action-buttons">

                                    <button
                                        className="icon-btn"
                                        title="Edit"
                                    >

                                        <Pencil size={16} />

                                    </button>

                                    <button
                                        className="icon-btn icon-btn-danger"
                                        title="Delete"
                                    >

                                        <Trash2 size={16} />

                                    </button>

                                </td>

                            </tr>

                        ))

                    )}

                </tbody>

            </table>

        </div>

    );

}