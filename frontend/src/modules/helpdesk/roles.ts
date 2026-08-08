// Mirrors backend/app/modules/helpdesk/dependencies.py::PRIVILEGED_TIERS.
// Manager / Admin-Leadership / HR-Restricted own the full ticket queue and
// can update any ticket. A plain Employee only works with tickets they
// personally raised (FR-HLP-04/FR-HLP-05). Keeping this list in one place
// means the UI and the API always agree on who counts as "privileged".
const PRIVILEGED_TIERS = new Set(["Manager", "Admin/Leadership", "HR-Restricted"]);

export function isHelpdeskPrivileged(accessTier?: string | null): boolean {
  return !!accessTier && PRIVILEGED_TIERS.has(accessTier);
}
