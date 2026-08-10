// Mirrors backend/app/modules/training/dependencies.py.

// FR-LMS-01: only Admin/Leadership defines training programs and units.
const ADMIN_TIERS = new Set(["Admin/Leadership"]);

// FR-LMS-05: cohort-wide progress and enrollment management is a
// Manager/HR/Admin view, not something a plain Employee needs.
const COHORT_VIEW_TIERS = new Set(["Manager", "Admin/Leadership", "HR-Restricted"]);

export function isTrainingAdmin(accessTier?: string | null): boolean {
  return !!accessTier && ADMIN_TIERS.has(accessTier);
}

export function isTrainingCohortViewer(accessTier?: string | null): boolean {
  return !!accessTier && COHORT_VIEW_TIERS.has(accessTier);
}
