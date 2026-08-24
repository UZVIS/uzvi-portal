import { useEffect } from "react";
import "./HelpdeskToast.css";

export type HelpdeskToastKind = "success" | "error";

interface HelpdeskToastProps {
  message: string;
  kind: HelpdeskToastKind;
  onDismiss: () => void;
  durationMs?: number;
}

/**
 * Lightweight inline toast used across the Helpdesk module in place of
 * browser alert() popups. Self-contained (own styles, no dependency on
 * shared/components) so it doesn't rely on files outside this module.
 */
export function HelpdeskToast({
  message,
  kind,
  onDismiss,
  durationMs = 3000,
}: HelpdeskToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [message, onDismiss, durationMs]);

  return (
    <div className={`helpdesk-toast helpdesk-toast--${kind}`} role="status">
      {message}
    </div>
  );
}
