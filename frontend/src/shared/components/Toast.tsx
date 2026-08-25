import { useEffect } from "react";

export type ToastKind = "success" | "error";

interface ToastProps {
  message: string;
  kind: ToastKind;
  onDismiss: () => void;
  durationMs?: number;
}

export function Toast({ message, kind, onDismiss, durationMs = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, onDismiss, durationMs]);

  return (
    <div className={`toast toast--${kind}`} role="status">
      {message}
    </div>
  );
}