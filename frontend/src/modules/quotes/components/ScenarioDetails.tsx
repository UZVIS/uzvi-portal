import type { QuoteScenario } from "../types/quote";

interface Props {
    scenario: QuoteScenario;
}

export default function ScenarioDetails({
    scenario,
}: Props) {

    return (

        <div>

            <div className="page-header">

                <div>

                    <h2>{scenario.name}</h2>

                    <p>
                        {scenario.output_type.toUpperCase()} • Target Margin :{" "}
                        {scenario.target_margin * 100}%
                    </p>

                </div>

            </div>

            <div className="table-card">

                <div className="table-toolbar">

                    <h3>Cost Line Items</h3>

                    <button className="add-btn">

                        + Add Item

                    </button>

                </div>

                <table className="data-table">

                    <thead>

                        <tr>

                            <th>Description</th>

                            <th>Vendor Cost</th>

                            <th>Internal Cost</th>

                            <th>Quantity</th>

                            <th>Total</th>

                        </tr>

                    </thead>

                    <tbody>

                        <tr>

                            <td
                                colSpan={5}
                                className="empty-row"
                            >
                                No line items found.
                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        </div>

    );

}