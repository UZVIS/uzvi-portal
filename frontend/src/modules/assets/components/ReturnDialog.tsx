import { useEffect, useState } from "react";
import { RotateCcw, X } from "lucide-react";

import "../styles/form.css";

interface ReturnDialogProps {
    isOpen: boolean;
    assignmentId: string;
    assetId: string;
    employeeName: string;
    onClose: () => void;
    onReturn: (data: {
        returnDate: string;
        remarks: string;
    }) => void;
}

export default function ReturnDialog({
    isOpen,
    assignmentId,
    assetId,
    employeeName,
    onClose,
    onReturn,
}: ReturnDialogProps) {

    const [returnDate, setReturnDate] = useState("");
    const [remarks, setRemarks] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        setReturnDate(
            new Date().toISOString().split("T")[0]
        );

        setRemarks("");
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="asset-form-overlay">

            <div className="asset-form-modal">

                {/* Header */}

                <div className="asset-form-header">

                    <div className="asset-form-header-left">

                        <div className="asset-form-icon">
                            <RotateCcw size={20} />
                        </div>

                        <div>
                            <h2 className="asset-form-title">
                                Return Asset
                            </h2>

                            <p className="asset-form-subtitle">
                                Return this assigned asset
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

                        <div className="asset-form-field full-span">

                            <label className="asset-form-label">
                                Assignment ID
                            </label>

                            <input
                                className="asset-form-input"
                                value={assignmentId}
                                disabled
                            />

                        </div>

                        <div className="asset-form-field full-span">

                            <label className="asset-form-label">
                                Asset ID
                            </label>

                            <input
                                className="asset-form-input"
                                value={assetId}
                                disabled
                            />

                        </div>

                        <div className="asset-form-field full-span">

                            <label className="asset-form-label">
                                Assigned To
                            </label>

                            <input
                                className="asset-form-input"
                                value={employeeName}
                                disabled
                            />

                        </div>

                        <div className="asset-form-field">

                            <label className="asset-form-label">
                                Return Date
                            </label>

                            <input
                                type="date"
                                className="asset-form-input"
                                value={returnDate}
                                onChange={(e) =>
                                    setReturnDate(e.target.value)
                                }
                            />

                        </div>

                        <div className="asset-form-field full-span">

                            <label className="asset-form-label">
                                Remarks
                            </label>

                            <textarea
                                rows={3}
                                className="asset-form-textarea"
                                placeholder="Optional remarks..."
                                value={remarks}
                                onChange={(e) =>
                                    setRemarks(e.target.value)
                                }
                            />

                        </div>

                    </div>

                </div>

                {/* Footer */}

                <div className="asset-form-footer">

                    <button
                        className="asset-form-cancel-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="asset-form-save-btn"
                        onClick={() =>
                            onReturn({
                                returnDate,
                                remarks,
                            })
                        }
                    >
                        Return Asset
                    </button>

                </div>

            </div>

        </div>
    );
}