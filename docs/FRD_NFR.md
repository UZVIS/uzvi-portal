# UZVI Services Employee Self-Management Portal
## Functional & Non-Functional Requirements Document (FRD/NFR)

**Version:** 1.1 · **Status:** Approved · **Prepared for:** UZVI Services
**Scope:** Foundation + 14 modules, one internal portal

---

## 1. Purpose & Scope

This document defines the functional and non-functional requirements for UZVI Services' internal **Employee Self-Management Portal** — a single application composed of independent, modular components that together form one coherent internal tool.

It covers:
- The **shared foundation** every module plugs into (Employee Directory / identity)
- **14 functional modules**
- **Non-functional requirements** that apply across the whole system — security, data privacy/compliance, performance, availability, and more
- The **integration contract** that defines how the modules combine into one application

This document defines *what* the system must do. Build sequencing and technical implementation specs are a separate, subsequent exercise.

---

## 2. System Overview & Architecture Principles

**Shape:** One FastAPI application, multiple routers — each module is its own set of tables, business logic, and a router mounted under its own URL prefix (e.g. `/leave`, `/attendance`, `/utilization`), all referencing one shared `employee_id`.

**Why this shape:**
- Each module is self-contained — its own data, its own logic, its own dashboard — with no module depending on another module's internals.
- All modules share one identity — an employee exists exactly once in the system, referenced everywhere.
- The application assembles from independent parts by mounting each module's router into one app, rather than requiring an ongoing integration effort.

**Architectural dependency:** every module's data model has a foreign-key dependency on the Employee Directory (Section 5, Module 0). This is a structural constraint of the design, not a sequencing preference: no module's employee-linked functionality can be meaningfully tested without it.

**Established technical pattern:** Python business logic layer (validation, calculations) → SQLite/Postgres storage layer → FastAPI routes (JSON API) → React frontend. Every module shall follow this same layering for consistency and maintainability.

---

## 3. Stakeholders & User Roles

| Role | Description | Typical access |
|---|---|---|
| **Admin/Leadership** | Founder(s), HR lead | Full access across all modules, org-wide views, configuration |
| **HR-Restricted** | Designated HR personnel only | Everything Admin has, plus the elevated access required for the most sensitive fields (Section 6.2) — this tier exists specifically for the medical-adjacent details in Leave Management (M2) and the identity/salary documents in the Document Repository (M8) |
| **Manager** | Team/project lead | Approval actions (leave, expenses, performance) for their reports; team-level views |
| **Employee/Consultant** | Everyone else | Self-service: own data entry, own dashboards, requests requiring approval |

Every module's functional requirements below assume this four-tier role model unless stated otherwise.

---

## 4. Module Directory

| # | Module |
|---|---|
| M0 | Employee Directory & Identity |
| M1 | Consultant Utilization Tracker |
| M2 | Leave Management |
| M3 | Attendance Tracker |
| M4 | Expense Claims |
| M5 | Onboarding / New Joiner Tracker |
| M6 | Training / Learning Progress Tracker |
| M7 | Asset Management |
| M8 | Document Repository |
| M9 | Announcements / Notice Board |
| M10 | Performance & Goals Tracker |
| M11 | HR / IT Helpdesk (Ticketing) |
| M12 | Recruiting / Candidate Pipeline Tracker |
| M13 | Quote & Tender Calculator (BD) |
| M14 | Company Calendar |

---

## 5. Module Requirements

Each module lists **Functional Requirements (FR)**, numbered `FR-<module>-<n>`. Non-functional requirements are consolidated in Section 6 and apply to every module.

---

### M0 — Employee Directory & Identity

**Purpose:** The single source of truth for "who exists" that every other module references.

| ID | Requirement |
|---|---|
| FR-DIR-01 | System shall store core employee records: employee ID, name, role/designation, team, reporting manager, join date, employment status (active/exited), contact details. |
| FR-DIR-02 | System shall support four access tiers (Admin/Leadership, HR-Restricted, Manager, Employee) assignable per employee, per Section 3. |
| FR-DIR-03 | System shall provide a searchable directory (by name, team, role) viewable by all employees. |
| FR-DIR-04 | System shall provide an org-chart view showing reporting lines. |
| FR-DIR-05 | Admin shall be able to add, edit, and mark an employee as exited (soft-delete, not hard-delete — see NFR-DATA-03). |
| FR-DIR-06 | Every other module's data model shall reference `employee_id` as a foreign key into this directory; no module may maintain its own separate employee list. |

---

### M1 — Consultant Utilization Tracker

**Purpose:** Track consultant hours, utilization %, and project margins.

| ID | Requirement |
|---|---|
| FR-UTL-01 | Consultants shall log hours against a project (or pseudo-project: Bench, Training, Internal, BD/Presales, Leave), with date, hours, billable flag, notes. |
| FR-UTL-02 | System shall compute utilization % = billable hours ÷ available hours (capacity × weeks in period) per consultant per period. |
| FR-UTL-03 | System shall flag consultants as under-utilized (<60%) or over-allocated (>105%). |
| FR-UTL-04 | System shall compute per-project revenue, cost, and margin from logged hours and billing/cost rates. |
| FR-UTL-05 | Leadership dashboard shall show org-wide utilization, bench-risk list, over-allocation list, and per-project margin table. |
| FR-UTL-06 | Personal dashboard shall show each consultant their own utilization %, hours-by-project breakdown, and weekly trend. |
| FR-UTL-07 | Time entries shall carry a `source` field (manual/import) so bulk-import support can be added without a schema change. |
| FR-UTL-08 | Consultant records shall reference the shared Employee Directory (M0) `employee_id` as their sole identity source, not a module-local consultant table. |

---

### M2 — Leave Management

**Purpose:** Leave application, approval, and balance tracking, compliant with Indian statutory leave frameworks.

**Grounding:** Indian leave entitlements are governed by a mix of central and state law (Shops & Establishments Acts, Factories Act, Maternity Benefit Act, and — as of April 2026 — the consolidated Occupational Safety, Health and Working Conditions (OSH) Code). The system must support configurable leave types and rules rather than hardcoding one state's entitlements, since rules vary by state and have already changed once this year under the OSH Code.

| ID | Requirement |
|---|---|
| FR-LV-01 | System shall support configurable leave types at minimum: Earned/Privilege Leave (EL), Casual Leave (CL), Sick Leave (SL), Maternity Leave (ML), Paternity Leave, Compensatory Off, Bereavement Leave, Leave Without Pay (LWP). |
| FR-LV-02 | Each leave type shall have configurable rules: annual entitlement, accrual method (e.g. EL accrues at 1 day per 20 days worked per the OSH Code), carry-forward limit, encashment eligibility, and whether a supporting document (e.g. medical certificate) is required above a threshold (e.g. SL beyond 2–3 consecutive days). |
| FR-LV-03 | Employees shall apply for leave specifying type, date range, and reason; system shall auto-exclude intervening weekends/holidays from the day-count for leave types where that is standard practice (CL, EL). |
| FR-LV-04 | System shall route leave requests through a configurable approval chain (default: reporting manager → HR-Restricted tier for leave types requiring HR sign-off, e.g. Maternity Leave). |
| FR-LV-05 | System shall track leave balance per employee per leave type, updating on approval and on year-end carry-forward/lapse processing. |
| FR-LV-06 | System shall block leave application beyond available balance unless explicitly submitted as Leave Without Pay. |
| FR-LV-07 | System shall detect and flag overlapping leave within the same team above a configurable threshold (e.g., more than 30% of a team on leave simultaneously) to support manager planning. |
| FR-LV-08 | System shall support Maternity Leave's distinct entitlement structure (26 weeks for first two children, 12 weeks thereafter, 12 weeks for adoptive/surrogate mothers) as a configured leave-type variant, not hardcoded logic. |
| FR-LV-09 | Managers shall have a team leave calendar view; Admin shall have an org-wide view. |
| FR-LV-10 | System shall maintain an audit trail of every leave application, approval/rejection, and balance adjustment. |
| FR-LV-11 | The reason/notes field for medical leave types (Sick, Maternity) shall be visible only to the HR-Restricted tier and the employee themselves — not to the general Manager tier. |

---

### M3 — Attendance Tracker

**Purpose:** Daily presence tracking (check-in/out or WFH/office status) and monthly summaries.

| ID | Requirement |
|---|---|
| FR-ATT-01 | Employees shall mark daily status: In-Office, WFH, On-Leave (auto-populated from M2 where applicable), or Absent. |
| FR-ATT-02 | System shall support check-in/check-out timestamps where hourly tracking is relevant (optional per role). |
| FR-ATT-03 | System shall compute monthly attendance summary per employee: days present, WFH days, leave days, absences. |
| FR-ATT-04 | Managers shall view team-level daily/weekly attendance at a glance. |
| FR-ATT-05 | System shall flag unexplained absences (no attendance mark and no approved leave) for manager follow-up. |
| FR-ATT-06 | Attendance data shall be exportable per employee per month (supports payroll handoff without building payroll itself). |

---

### M4 — Expense Claims

**Purpose:** Expense submission, approval, and reimbursement status tracking.

| ID | Requirement |
|---|---|
| FR-EXP-01 | Employees shall submit expense claims with category, amount, date, description, and receipt attachment. |
| FR-EXP-02 | System shall support configurable expense categories (travel, client entertainment, training, misc.), each with an optional per-category cap. |
| FR-EXP-03 | Claims shall route through an approval chain (manager, then Admin/Finance above a configurable amount threshold). |
| FR-EXP-04 | System shall track claim status: Submitted → Approved/Rejected → Reimbursed, with timestamps at each stage. |
| FR-EXP-05 | System shall flag claims missing a required receipt above a configurable amount threshold. |
| FR-EXP-06 | System shall provide a per-project expense rollup (links to M1/project data) to support project cost tracking. |
| FR-EXP-07 | Employees shall see their own claim history and running reimbursement-pending total. |

---

### M5 — Onboarding / New Joiner Tracker

**Purpose:** Track each new hire through a structured onboarding checklist.

| ID | Requirement |
|---|---|
| FR-ONB-01 | Admin shall define an onboarding checklist template composed of ordered tasks/milestones (e.g. documentation collection, asset issuance, foundation training modules, system access provisioning). |
| FR-ONB-02 | A new joiner shall be assigned a checklist instance on their join date, referencing the shared Employee Directory record (M0). |
| FR-ONB-03 | Each task shall be markable complete by the responsible party (new joiner, HR, IT, or manager, depending on task type) with a timestamp. |
| FR-ONB-04 | System shall show onboarding completion % per new joiner and flag overdue tasks past an expected completion window. |
| FR-ONB-05 | Admin/HR shall have a cohort view showing all current joiners' onboarding progress side by side. |

---

### M6 — Training / Learning Progress Tracker

**Purpose:** Track each employee's progress through UZVI Services' training curricula.

| ID | Requirement |
|---|---|
| FR-LMS-01 | Admin shall define training programs composed of ordered modules/units. |
| FR-LMS-02 | Employees shall be enrolled in one or more programs and mark units complete, with an optional score/assessment result per unit. |
| FR-LMS-03 | System shall compute per-employee and per-cohort completion %. |
| FR-LMS-04 | System shall support attaching an assessment result to a training unit. |
| FR-LMS-05 | Managers/trainers shall view cohort-wide progress and flag employees falling behind an expected pace. |

---

### M7 — Asset Management

**Purpose:** Track company asset issuance and return per employee.

| ID | Requirement |
|---|---|
| FR-AST-01 | Admin shall register assets with a unique tag, type, purchase date, and current status (In Stock / Assigned / Under Repair / Retired). |
| FR-AST-02 | Admin shall assign an asset to an employee with an issuance date; system shall log the full assignment history per asset. |
| FR-AST-03 | System shall track expected return on exit (linked to Employee Directory exit status, M0) and flag unreturned assets for exited employees. |
| FR-AST-04 | Employees shall view their currently assigned assets. |
| FR-AST-05 | Admin shall view org-wide asset inventory: counts by type/status, assets nearing warranty expiry (if tracked). |

---

### M8 — Document Repository

**Purpose:** Self-service access to personal HR documents and secure storage of identity documents.

| ID | Requirement |
|---|---|
| FR-DOC-01 | HR-Restricted tier shall upload employee-specific documents (payslip, offer letter, experience letter) tagged to an employee ID and document type. |
| FR-DOC-02 | Employees shall view/download only their own documents; no employee shall be able to browse another's documents. |
| FR-DOC-03 | System shall support employee self-upload of required documents (ID proof, address proof) during onboarding, linked to M5. |
| FR-DOC-04 | System shall log every document access/download event. |
| FR-DOC-05 | System shall support a document retention/expiry policy per document type. |
| FR-DOC-06 | Only the HR-Restricted tier and the document owner shall have read access; the general Admin/Manager tiers shall not, given the sensitivity of identity and salary documents. |

---

### M9 — Announcements / Notice Board

**Purpose:** Company-wide or team-targeted announcements.

| ID | Requirement |
|---|---|
| FR-ANN-01 | Admin/Manager shall post announcements with a title, body, target audience (company-wide, specific team, or specific role), and optional expiry date. |
| FR-ANN-02 | Employees shall see announcements targeted at them (company-wide + their team) on a shared landing view. |
| FR-ANN-03 | System shall support acknowledgment tracking for announcements marked "requires acknowledgment," showing Admin who has/hasn't acknowledged. |
| FR-ANN-04 | Announcements shall be listed newest-first and archived (not deleted) after expiry. |

---

### M10 — Performance & Goals Tracker

**Purpose:** Quarterly/periodic goal-setting, self-assessment, and manager review status.

| ID | Requirement |
|---|---|
| FR-PERF-01 | Employees shall set goals for a defined review period, each with a description and target outcome. |
| FR-PERF-02 | Employees shall submit a self-assessment against each goal at period end. |
| FR-PERF-03 | Managers shall submit a review/rating against each goal and an overall period rating. |
| FR-PERF-04 | System shall track review-cycle status per employee (Not Started / Self-Assessment Submitted / Manager Review Pending / Completed). |
| FR-PERF-05 | Admin/HR shall view org-wide review-cycle completion status to chase overdue reviews. |
| FR-PERF-06 | Historical review cycles shall remain viewable (read-only) for an employee's performance history. |

---

### M11 — HR / IT Helpdesk (Ticketing)

**Purpose:** Raise and track internal support requests.

| ID | Requirement |
|---|---|
| FR-HLP-01 | Employees shall raise a ticket with category (HR / IT / Facilities / Other), description, and priority. |
| FR-HLP-02 | Tickets shall route to the relevant team/owner by category (configurable). |
| FR-HLP-03 | System shall track ticket status (Open → In Progress → Resolved → Closed) with timestamps and an activity/comment log. |
| FR-HLP-04 | Employees shall see status of their own open/past tickets. |
| FR-HLP-05 | Assigned owners/Admin shall view a queue of open tickets, filterable by category, priority, and age. |
| FR-HLP-06 | System shall flag tickets open beyond a configurable SLA threshold per priority level. |

---

### M12 — Recruiting / Candidate Pipeline Tracker

**Purpose:** Structured tracking of candidates across the hiring pipeline.

| ID | Requirement |
|---|---|
| FR-REC-01 | Recruiters shall log candidates with resume details, applied role, and source. |
| FR-REC-02 | System shall track candidate stage (Applied → Screened → Interview(s) → Offer → Hired/Rejected) with timestamps and interviewer notes per stage. |
| FR-REC-03 | System shall support attaching interview scorecards per stage, with questions tied to resume content and behavioral questions grounded in real projects. |
| FR-REC-04 | System shall detect and flag candidates with highly similar project descriptions/resume content across the candidate pool. |
| FR-REC-05 | On hire, a candidate record shall convert into an Employee Directory (M0) record without re-entering data. |
| FR-REC-06 | Recruiters/Admin shall view pipeline-wide funnel stats (candidates per stage, per role, per source) and time-in-stage. |

---

### M13 — Quote & Tender Calculator (BD)

**Purpose:** Repeatable commercial structuring for client quotes and formal tenders.

| ID | Requirement |
|---|---|
| FR-BD-01 | Users shall input cost components (vendor/license costs, internal effort cost, per-user counts, cohort splits where relevant). |
| FR-BD-02 | System shall compute a **client-facing quote** view: rolled-up per-user/per-line pricing with service charges embedded, not separately itemized. |
| FR-BD-03 | System shall compute a **tender-formatted** view from the same inputs: vendor charges as separate, explicit line items, suitable for formal submission. |
| FR-BD-04 | Users shall specify a target margin %; system shall back-calculate required selling price and show resulting margin on both output views. |
| FR-BD-05 | System shall save quote/tender scenarios per opportunity for reuse and comparison. |
| FR-BD-06 | System shall support a reusable library of standard cost line items (common software licenses, standard consulting day-rates) to speed up future quotes. |

---

### M14 — Company Calendar

**Purpose:** Central calendar of holidays, company events, and a leave overlay.

This module has functional overlap with M2's team leave calendar view (FR-LV-09). It is scoped as a standalone module with its own purpose — holidays and company events, which M2 does not cover — and consumes M2's approved-leave data as an overlay rather than duplicating leave logic.

| ID | Requirement |
|---|---|
| FR-CAL-01 | Admin shall maintain a company holiday calendar, supporting state-specific holiday variation. |
| FR-CAL-02 | Admin shall post company-wide events with date, description, and location/link. |
| FR-CAL-03 | System shall overlay approved team leave (sourced from M2) on a shared calendar view for manager planning. |
| FR-CAL-04 | Employees shall view the calendar filtered by month/team. |

---

## 6. Non-Functional Requirements

These apply across all 15 modules unless a module explicitly states otherwise.

### 6.1 Security & Access Control

| ID | Requirement |
|---|---|
| NFR-SEC-01 | System shall enforce role-based access control (Admin / HR-Restricted / Manager / Employee) at the API layer, not just hidden in the UI. |
| NFR-SEC-02 | Each employee shall access only their own personal data (leave, attendance, expenses, documents, performance) except where their role explicitly grants broader access. |
| NFR-SEC-03 | All API endpoints handling personal data shall require authentication; no endpoint shall be callable anonymously in production. |
| NFR-SEC-04 | Passwords/credentials, where used, shall never be stored in plain text. |
| NFR-SEC-05 | V1 may use a lightweight internal auth scheme (identifier-based, no external login), but the data model must not preclude adding proper authentication (SSO/password) later without restructuring. |

### 6.2 Data Privacy & Regulatory Compliance

This portal will hold digital personal data of employees — identity details, attendance, leave (including health-related reasons for sick/maternity leave), financial data (expenses), performance records, and recruiting candidate data. This falls under **India's Digital Personal Data Protection Act, 2023 (DPDP Act) and the DPDP Rules, 2025**.

**Current regulatory status:** the DPDP Rules were notified on 13 November 2025 and are rolling out in phases: the Data Protection Board is already active; the Consent Manager framework activates 13 November 2026; full operative compliance (notice, consent, rights, and duties provisions) is required by **13 May 2027**. 2026 is the designated build year. UZVI Services is a **Data Fiduciary** under the Act, employees are **Data Principals**, and any third-party tool this portal integrates with (e.g. a payroll processor) would be a **Data Processor** requiring an appropriate data-processing agreement.

| ID | Requirement |
|---|---|
| NFR-COMP-01 | System shall collect only the personal data each module functionally requires (data minimization) — no speculative fields "for later." |
| NFR-COMP-02 | System shall support purpose-limited use: employee data collected for HR/employment purposes shall not be repurposed without basis. Processing for core employment obligations and statutory compliance is a recognized "legitimate use" under the Act and does not require fresh consent for that purpose. |
| NFR-COMP-03 | System shall support data correction — an employee shall be able to request correction of inaccurate personal data, consistent with Data Principal rights under the Act. |
| NFR-COMP-04 | System shall support data erasure/anonymization for exited employees once the retention purpose has lapsed, with erasure requests processed within the Act's specified window (90 days). |
| NFR-COMP-05 | System shall implement reasonable security safeguards (encryption at rest for sensitive fields, access logging, RBAC) — failure to do so carries the Act's most severe penalty tier (up to ₹250 crore for inadequate security safeguards). |
| NFR-COMP-06 | System shall maintain a basic security-incident log as a precursor to formal breach-notification workflow, ahead of the enhanced Significant Data Fiduciary obligations expected from May 2027. |
| NFR-COMP-07 | Fields identified as higher-sensitivity (medical-related leave reasons in M2; identity and salary documents in M8) shall carry stricter access logging and are restricted to the HR-Restricted tier per Section 3. |
| NFR-COMP-08 | V1 shall implement the structural basics now (minimization, RBAC, access logs, correction/erasure capability); consent-management and grievance-redressal workflows are scoped for a V2 release timed to the November 2026 / May 2027 regulatory milestones. |

### 6.3 Performance

| ID | Requirement |
|---|---|
| NFR-PERF-01 | Dashboard pages shall render within 2 seconds for a data range of up to 1 year for a single employee, and within 3 seconds for org-wide leadership views at current headcount, with headroom to at least 100 employees. |
| NFR-PERF-02 | API endpoints for single-record reads/writes shall respond within 500ms under normal load. |

### 6.4 Availability & Reliability

| ID | Requirement |
|---|---|
| NFR-AVL-01 | The portal is an internal business tool, not customer-facing; target availability is business-hours reliability, with planned maintenance windows acceptable. |
| NFR-AVL-02 | Daily backups minimum, given this system holds records (leave history, expense approvals) that cannot be reconstructed if lost. |

### 6.5 Scalability

| ID | Requirement |
|---|---|
| NFR-SCL-01 | The data model shall comfortably support UZVI Services' current and near-term headcount on SQLite; the storage layer shall be swappable to Postgres without application-layer rework. |

### 6.6 Usability

| ID | Requirement |
|---|---|
| NFR-USE-01 | Every module's frontend views shall follow one consistent design system (shared React component library and theme) so the assembled portal feels like one product, not 14 disconnected tools. |
| NFR-USE-02 | Every module shall expose its functionality both as a documented API (auto-generated FastAPI docs) and as at least one React frontend view consuming that API — no module shall be API-only with no visual output. |

### 6.7 Maintainability & Extensibility

| ID | Requirement |
|---|---|
| NFR-MNT-01 | Each module shall be structured as an independent package (own models/service/routes/dashboard files) mounted into the shared app — no module's code shall directly import another module's internals. |
| NFR-MNT-02 | Every module shall reference employees solely via `employee_id` from the shared Directory (M0) — no module may maintain a duplicate employee list. |
| NFR-MNT-03 | Each module shall include unit tests for its core business logic (calculations, validation rules). |
| NFR-MNT-04 | Each module's data-entry endpoints shall be designed with a `source` field or equivalent where bulk import is a plausible future need, so import support can be added without schema changes. |

### 6.8 Auditability & Logging

| ID | Requirement |
|---|---|
| NFR-AUD-01 | All approval actions (leave, expenses, performance reviews) shall be logged with actor, timestamp, and action — not just the final state. |
| NFR-AUD-02 | All access to sensitive documents (M8) shall be logged (who viewed/downloaded what, when). |

### 6.9 Data Retention & Backup

| ID | Requirement |
|---|---|
| NFR-DATA-01 | Each module shall define a retention period for its data category, informed by its regulatory basis. |
| NFR-DATA-02 | Backups shall be taken on a defined schedule (minimum daily) with a tested restore process. |
| NFR-DATA-03 | Exited employees' records shall be soft-deleted (status flag) rather than hard-deleted, preserving historical data integrity for reporting while excluding them from active views, subject to the erasure requirements in NFR-COMP-04 once retention purpose lapses. |

### 6.10 Technology Constraints

| ID | Requirement |
|---|---|
| NFR-TECH-01 | Backend: Python + FastAPI, exposing JSON APIs. |
| NFR-TECH-02 | Storage: SQLite for V1/development, with a clean path to Postgres for shared/production deployment. |
| NFR-TECH-03 | Frontend: React, consuming each module's FastAPI JSON endpoints through a shared component library and theme, per NFR-USE-01. |

---

## 7. Cross-Module Integration Contract

1. **Identity:** every module's tables reference `employee_id` (string) — no module invents its own employee identifier.
2. **Mounting convention:** each module is a FastAPI `APIRouter` under its own prefix (`/leave`, `/attendance`, `/assets`, etc.), assembled into one `app` at integration time.
3. **Frontend convention:** each module's backend exposes JSON endpoints consumed by a corresponding React view/route, following the shared design system (Section 6.6).
4. **Response conventions:** consistent error format (404 for unknown employee/record, 422 for validation failures) across all modules.
5. **Database:** each module may use its own tables but shares one SQLite file for V1, with `employee_id` as the join key for any cross-module reporting.

---

## 8. Assumptions & Constraints

- Current headcount is small (tens, not hundreds) — V1 requirements are sized accordingly; NFR performance/scalability targets reflect this.
- No existing HRMS/payroll system to integrate with in V1 — this portal is the first internal system of its kind; import/integration hooks are designed for but not required to function end-to-end in V1.
- Authentication is intentionally lightweight for V1 given internal-only, trusted-user context.
- Leave rules (M2) must be configurable, not hardcoded, given ongoing Indian labor-law evolution.
- The Employee Directory (M0) is a structural prerequisite for every other module's employee-linked functionality, per Section 2.

## 9. Out of Scope (V1)

- Payroll processing itself (attendance/expense data may feed a future payroll handoff, but payroll computation is not built here).
- External SSO/enterprise identity provider integration.
- Mobile native apps (web-responsive is sufficient for V1).
- Full DPDP consent-management and grievance-redressal workflows (scoped as V2, per NFR-COMP-08).

---

*This document defines the approved scope for the Employee Self-Management Portal. Per-module technical specifications (schema, API contracts, and data model detail) follow as the next deliverable.*
