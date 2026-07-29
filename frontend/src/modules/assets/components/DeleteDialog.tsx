import { AlertTriangle } from "lucide-react";

import "../styles/form.css";

interface DeleteDialogProps {
    isOpen: boolean;
    assetId: string;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteDialog({
    isOpen,
    assetId,
    onClose,
    onConfirm,
}: DeleteDialogProps) {

    if (!isOpen) return null;

    return (

        <div className="asset-form-overlay">

            <div className="asset-form-modal delete-dialog">

                <div className="delete-dialog-header">

                    <div className="delete-dialog-icon">
                        <AlertTriangle size={26} />
                    </div>

                    <h2 className="delete-dialog-title">
                        Delete Asset
                    </h2>

                    <p className="delete-dialog-subtitle">
                        This action cannot be undone.
                    </p>

                </div>

                <div className="delete-dialog-body">

                    <p>
                        Are you sure you want to delete
                        <strong> {assetId}</strong>?
                    </p>

                </div>

                <div className="delete-dialog-footer">

                    <button
                        className="asset-form-cancel-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="asset-form-save-btn delete-dialog-confirm-btn"
                        onClick={onConfirm}
                    >
                        Delete
                    </button>

                </div>

            </div>

        </div>

    );

}
