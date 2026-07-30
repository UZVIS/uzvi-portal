import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal confirm-modal">

        <div className="confirm-icon">
          <AlertTriangle size={22} />
        </div>

        <h2>{title}</h2>
        <p className="confirm-message">{message}</p>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="danger-btn" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
}