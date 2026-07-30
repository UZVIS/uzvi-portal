import {
    Wallet,
    TrendingUp,
    BadgeDollarSign,
    Layers,
} from "lucide-react";

import type {
    QuoteScenario,
} from "../types/quote";

interface Props {
    scenario: QuoteScenario;
}

export default function CostSummaryCards({
    scenario,
}: Props) {

const totalCost = scenario.line_items.reduce(

    (sum, item) =>

        sum +
        (
            (item.vendor_cost + item.internal_cost)
            * item.quantity
        ),

    0

);

const sellingPrice =
    totalCost / (1 - scenario.target_margin);

const cards = [

        {
            title: "Total Cost",
            value: `$${totalCost.toFixed(2)}`,
            icon: Wallet,
            tone: "orange",
        },

        {
            title: "Target Margin",
            value: `${scenario.target_margin * 100}%`,
            icon: TrendingUp,
            tone: "blue",
        },

        {
            title: "Selling Price",
            value: `$${sellingPrice.toFixed(2)}`,
            icon: BadgeDollarSign,
            tone: "green",
        },

        {
            title: "Line Items",
            value: `${scenario.line_items.length}`,
            icon: Layers,
            tone: "amber",
        },

    ];

    return (

        <div className="cost-row">

            {cards.map((card) => {

                const Icon = card.icon;

                return (

                    <div
                        key={card.title}
                        className="cost-card"
                    >

                        <div className={`cost-icon ${card.tone}`}>
                            <Icon size={20} />
                        </div>

                        <div>
                            <div className="cost-label">{card.title}</div>
                            <div className="cost-value">{card.value}</div>
                        </div>

                    </div>

                );

            })}

        </div>

    );

}