import { useState } from "react";
import { X, CheckCircle2, TrendingUp } from "lucide-react";
import type { QuoteScenario } from "../types/quote";
import "../styles/scenario-comparison.css";

interface ComparisonResult {
    scenario_id: string;
    scenario_name: string;
    output_type: "quote" | "tender";
    target_margin: number;
    total_cost: number;
    selling_price: number;
    resulting_margin: number;
}

interface ComparisonResponse {
    opportunity_id: string;
    scenarios: ComparisonResult[];
}

interface Props {
    isOpen: boolean;
    scenarios: QuoteScenario[];
    currentScenarioId: string;
    onClose: () => void;
    onCompare: (
        scenarioIds: string[]
    ) => Promise<ComparisonResponse>;
}

export default function ScenarioComparisonDialog({
    isOpen,
    scenarios,
    currentScenarioId,
    onClose,
    onCompare,
}: Props) {

    const [selectedIds, setSelectedIds] = useState<string[]>(
        scenarios.map((scenario) => scenario.scenario_id)
    );

    const [results, setResults] = useState<ComparisonResult[]>([]);

    const [loading, setLoading] = useState(false);

    if (!isOpen) {
        return null;
    }

    const toggleScenario = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

    const handleCompare = async () => {

        if (selectedIds.length < 2) {
            return;
        }

        try {

            setLoading(true);

            const response = await onCompare(selectedIds);

            setResults(response.scenarios);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(value);
    };

    const getBestScenario = () => {

        if (!results.length) {
            return null;
        }

        return results.reduce((best, current) =>
            current.resulting_margin > best.resulting_margin
                ? current
                : best
        );
    };

    const bestScenario = getBestScenario();

    return (
        <div className="comparison-overlay">

            <div className="comparison-modal">

                {/* Header */}
                <div className="comparison-header">

                    <div>
                        <h2>
                            Compare Scenarios
                        </h2>

                        <p>
                            Compare pricing, costs and margins
                            across different scenarios.
                        </p>
                    </div>

                    <button
                        className="comparison-close"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>

                </div>


                {/* Scenario Selection */}
                <div className="comparison-section">

                    <div className="section-heading">

                        <div>
                            <h3>
                                Select Scenarios
                            </h3>

                            <p>
                                Select at least two scenarios
                                to compare.
                            </p>
                        </div>

                        <span className="selected-count">
                            {selectedIds.length} selected
                        </span>

                    </div>


                    <div className="scenario-selection-grid">

                        {scenarios.map((item) => {

                            const isSelected =
                                selectedIds.includes(
                                    item.scenario_id
                                );

                            const isCurrent =
                                item.scenario_id ===
                                currentScenarioId;

                            return (
                                <button
                                    key={item.scenario_id}
                                    type="button"
                                    className={`scenario-select-card ${
                                        isSelected
                                            ? "selected"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        toggleScenario(
                                            item.scenario_id
                                        )
                                    }
                                >

                                    <div className="scenario-card-left">

                                        <div
                                            className={`scenario-checkbox ${
                                                isSelected
                                                    ? "checked"
                                                    : ""
                                            }`}
                                        >
                                            {isSelected && (
                                                <CheckCircle2
                                                    size={18}
                                                />
                                            )}
                                        </div>

                                        <div>

                                            <div className="scenario-name">
                                                {item.name}
                                            </div>

                                            <div className="scenario-type">
                                                {item.output_type}
                                                {isCurrent && (
                                                    <span className="current-badge">
                                                        Current
                                                    </span>
                                                )}
                                            </div>

                                        </div>

                                    </div>

                                    <div className="scenario-margin">

                                        <span>
                                            Target Margin
                                        </span>

                                        <strong>
                                            {(
                                                item.target_margin *
                                                100
                                            ).toFixed(0)}
                                            %
                                        </strong>

                                    </div>

                                </button>
                            );
                        })}

                    </div>

                </div>


                {/* Actions */}
                <div className="comparison-actions">

                    <button
                        type="button"
                        className="comparison-cancel"
                        onClick={onClose}
                    >
                        Close
                    </button>

                    <button
                        type="button"
                        className="comparison-compare"
                        disabled={
                            selectedIds.length < 2 ||
                            loading
                        }
                        onClick={handleCompare}
                    >
                        <TrendingUp size={17} />

                        {loading
                            ? "Comparing..."
                            : "Compare"}
                    </button>

                </div>


                {/* Results */}
                {results.length > 0 && (
                    <div className="comparison-results">

                        <div className="results-heading">

                            <div>
                                <h3>
                                    Comparison Results
                                </h3>

                                <p>
                                    Side-by-side pricing
                                    and margin analysis.
                                </p>
                            </div>

                        </div>


                        <div className="comparison-table-wrapper">

                            <table className="comparison-table">

                                <thead>
                                    <tr>
                                        <th>Scenario</th>
                                        <th>Margin</th>
                                        <th>Total Cost</th>
                                        <th>Selling Price</th>
                                        <th>Resulting Margin</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {results.map((result) => {

                                        const isBest =
                                            bestScenario?.scenario_id ===
                                            result.scenario_id;

                                        return (
                                            <tr
                                                key={
                                                    result.scenario_id
                                                }
                                                className={
                                                    isBest
                                                        ? "best-row"
                                                        : ""
                                                }
                                            >

                                                <td>
                                                    <div className="result-scenario">

                                                        <strong>
                                                            {
                                                                result.scenario_name
                                                            }
                                                        </strong>

                                                        {isBest && (
                                                            <span className="best-badge">
                                                                Best Margin
                                                            </span>
                                                        )}

                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="margin-badge">
                                                        {(
                                                            result.target_margin *
                                                            100
                                                        ).toFixed(0)}
                                                        %
                                                    </span>
                                                </td>

                                                <td>
                                                    {formatCurrency(
                                                        result.total_cost
                                                    )}
                                                </td>

                                                <td className="selling-price">
                                                    {formatCurrency(
                                                        result.selling_price
                                                    )}
                                                </td>

                                                <td>
                                                    <strong className="result-margin">
                                                        {(
                                                            result.resulting_margin *
                                                            100
                                                        ).toFixed(0)}
                                                        %
                                                    </strong>
                                                </td>

                                            </tr>
                                        );
                                    })}

                                </tbody>

                            </table>

                        </div>


                        {/* Recommendation */}
                        {bestScenario && (
                            <div className="comparison-recommendation">

                                <div className="recommendation-icon">
                                    <TrendingUp size={20} />
                                </div>

                                <div>

                                    <span>
                                        Best Margin
                                    </span>

                                    <strong>
                                        {bestScenario.scenario_name}
                                    </strong>

                                    <p>
                                        This scenario provides the
                                        highest resulting margin of{" "}
                                        <b>
                                            {(
                                                bestScenario.resulting_margin *
                                                100
                                            ).toFixed(0)}
                                            %
                                        </b>.
                                    </p>

                                </div>

                            </div>
                        )}

                    </div>
                )}

            </div>

        </div>
    );
}