import type { ReactNode } from "react";
import "./ConfirmDialog.css";

interface Props {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  hideCancel = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="confirm-dialog__overlay" onClick={onCancel}>
      <div className="confirm-dialog__box" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-dialog__title">{title}</h3>
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          {!hideCancel && (
            <button className="confirm-dialog__btn confirm-dialog__btn--cancel" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button className="confirm-dialog__btn confirm-dialog__btn--confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}