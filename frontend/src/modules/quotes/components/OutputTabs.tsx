import { useEffect, useState } from "react";
import { FileText, ClipboardList } from "lucide-react";
import { toast } from "sonner";

import {
    getQuoteView,
    getTenderView,
} from "../services/quoteService";

import type {
    QuoteView,
    TenderView,
} from "../types/quote";

interface Props {
    scenarioId: string;
}

export default function OutputTabs({
    scenarioId,
}: Props) {

    const [activeTab, setActiveTab] =
        useState<"quote" | "tender">("quote");

    const [quoteView, setQuoteView] =
        useState<QuoteView | null>(null);

    const [tenderView, setTenderView] =
        useState<TenderView | null>(null);

    useEffect(() => {

        async function load() {

            try {

                const quote =
                    await getQuoteView(scenarioId);

                setQuoteView(quote);

                const tender =
                    await getTenderView(scenarioId);

                setTenderView(tender);

            } catch {

                toast.error(
                    "Failed to load preview."
                );

            }

        }

        load();

    }, [scenarioId]);

    return (

        <div className="output-section">

            <div className="tab-bar">

                <button
                    className={
                        activeTab === "quote"
                            ? "tab-btn active"
                            : "tab-btn"
                    }
                    onClick={() =>
                        setActiveTab("quote")
                    }
                >
                    <FileText size={15} />
                    Quote Preview
                </button>

                <button
                    className={
                        activeTab === "tender"
                            ? "tab-btn active"
                            : "tab-btn"
                    }
                    onClick={() =>
                        setActiveTab("tender")
                    }
                >
                    <ClipboardList size={15} />
                    Tender Preview
                </button>

            </div>

            {activeTab === "quote" ? (

    <div className="preview-card">

        <table className="data-table">

            <thead>

                <tr>

                    <th>Description</th>

                    <th>Qty</th>

                    <th>Unit Price</th>

                    <th>Line Total</th>

                </tr>

            </thead>

            <tbody>

                {quoteView?.lines.length ? (

                    quoteView.lines.map((line) => (

                        <tr key={line.line_item_id}>

                            <td>{line.description}</td>

                            <td>{line.quantity}</td>

                            <td>
                                ${line.unit_price.toFixed(2)}
                            </td>

                            <td>
                                ${line.line_total.toFixed(2)}
                            </td>

                        </tr>

                    ))

                ) : (

                    <tr>

                        <td colSpan={4} className="empty-row">
                            No quote preview available.
                        </td>

                    </tr>

                )}

            </tbody>

        </table>

        <div className="preview-summary">

    <p>
        <strong>Total Cost:</strong>{" "}
        ${quoteView?.total_cost?.toFixed(2) ?? "0.00"}
    </p>

    <p>
        <strong>Selling Price:</strong>{" "}
        ${quoteView?.selling_price?.toFixed(2) ?? "0.00"}
    </p>

    <p>
        <strong>Margin:</strong>{" "}
        {quoteView
            ? `${(quoteView.resulting_margin * 100).toFixed(2)}%`
            : "0%"}
    </p>

</div>

    </div>

) : (

                <div className="preview-card">

                    <table className="data-table">

   <thead>

    <tr>

        <th>Description</th>
        <th>Qty</th>
        <th>Vendor Unit</th>
        <th>Internal Unit</th>
        <th>Vendor Total</th>
        <th>Internal Total</th>
        <th>Selling Unit</th>
        <th>Selling Total</th>

    </tr>

</thead>

<tbody>

    {tenderView?.lines.length ? (

        tenderView.lines.map((line) => (

            <tr key={line.line_item_id}>

                <td>{line.description}</td>

                <td>{line.quantity}</td>

                <td>
                    ${line.vendor_unit_cost.toFixed(2)}
                </td>

                <td>
                    ${line.internal_unit_cost.toFixed(2)}
                </td>

                <td>
                    ${line.vendor_line_total.toFixed(2)}
                </td>

                <td>
                    ${line.internal_line_total.toFixed(2)}
                </td>

                <td>
                    ${line.selling_unit_price.toFixed(2)}
                </td>

                <td>
                    ${line.selling_line_total.toFixed(2)}
                </td>

            </tr>

        ))

    ) : (

        <tr>

            <td
                colSpan={8}
                className="empty-row"
            >
                No tender preview available.
            </td>

        </tr>

    )}

</tbody>

                    </table>

                   <div className="preview-summary">

    <p>
        <strong>Vendor Cost:</strong>{" "}
        ${tenderView?.total_vendor_cost?.toFixed(2) ?? "0.00"}
    </p>

    <p>
        <strong>Internal Cost:</strong>{" "}
        ${tenderView?.total_internal_cost?.toFixed(2) ?? "0.00"}
    </p>

    <p>
        <strong>Total Cost:</strong>{" "}
        ${tenderView?.total_cost?.toFixed(2) ?? "0.00"}
    </p>

    <p>
        <strong>Selling Price:</strong>{" "}
        ${tenderView?.selling_price?.toFixed(2) ?? "0.00"}
    </p>

    <p>
        <strong>Margin:</strong>{" "}
        {tenderView
            ? `${(tenderView.resulting_margin * 100).toFixed(2)}%`
            : "0%"}
    </p>

</div>

                </div>

            )}

        </div>

    );

}