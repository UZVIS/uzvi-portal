const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const BASE_PATH = `${API_BASE}/api/v1/onboarding`;

async function handle<T>(res: Response, notFoundMessage: string): Promise<T> {
  if (res.status === 404) {
    throw new Error(notFoundMessage);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    const message = typeof detail === "string" ? detail : JSON.stringify(detail ?? "Something went wrong. Try again.");
    throw new Error(message);
  }
  return res.json();
}

export interface OnboardingTemplate {
  template_id: string;
  name: string;
}

export interface OnboardingTask {
  task_id: string;
  template_id: string;
  name: string;
  seq: number;
  responsible_role: string;
}

export interface OnboardingInstance {
  instance_id: string;
  employee_id: string;
  template_id: string;
  start_date: string;
}

export interface TaskCompletion {
  id: number;
  instance_id: string;
  task_id: string;
  completed_by: string | null;
  completed_at: string | null;
}

export interface OnboardingProgress {
  instance_id: string;
  completion_pct: number;
}

/** GET /api/v1/onboarding/templates - list all templates */
export function listTemplates(): Promise<OnboardingTemplate[]> {
  return fetch(`${BASE_PATH}/templates`).then((r) =>
    handle(r, "Could not load templates.")
  );
}

/** GET /api/v1/onboarding/templates/{id}/tasks - list tasks for one template */
export function listTasksForTemplate(templateId: string): Promise<OnboardingTask[]> {
  return fetch(`${BASE_PATH}/templates/${encodeURIComponent(templateId)}/tasks`).then((r) =>
    handle(r, "Could not load tasks for that template.")
  );
}

/** POST /api/v1/onboarding/templates - Admin/Leadership only */
export function createTemplate(
  name: string,
  requesterId: string
): Promise<OnboardingTemplate> {
  return fetch(`${BASE_PATH}/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, requester_id: requesterId }),
  }).then((r) => handle(r, "Could not create the template."));
}

/** POST /api/v1/onboarding/tasks ordered tasks within a template, Admin/Leadership only */
export function addTask(input: {
  template_id: string;
  name: string;
  seq: number;
  responsible_role: string;
  requester_id: string;
  expected_days?: number;
  required_doc_type?: string;
}): Promise<OnboardingTask> {
  return fetch(`${BASE_PATH}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((r) => handle(r, "Could not add the task."));
}

/** POST /api/v1/onboarding/instances */
export function startOnboarding(
  employeeId: string,
  templateId: string,
  requesterId: string
): Promise<OnboardingInstance> {
  return fetch(`${BASE_PATH}/instances`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee_id: employeeId,
      template_id: templateId,
      requester_id: requesterId,
    }),
  }).then((r) => handle(r, "Could not start onboarding."));
}

/** GET /api/v1/onboarding/instances/{id} */
export function getInstance(instanceId: string): Promise<OnboardingInstance> {
  return fetch(`${BASE_PATH}/instances/${encodeURIComponent(instanceId)}`).then((r) =>
    handle(r, "That onboarding instance wasn't found.")
  );
}

/** GET /api/v1/onboarding/instances/{id}/progress */
export function getProgress(instanceId: string): Promise<OnboardingProgress> {
  return fetch(`${BASE_PATH}/instances/${encodeURIComponent(instanceId)}/progress`).then((r) =>
    handle(r, "That onboarding instance wasn't found.")
  );
}

/** GET /api/v1/onboarding/instances/{id}/completions - real per-task completion state */
export function getCompletedTaskIds(instanceId: string): Promise<string[]> {
  return fetch(`${BASE_PATH}/instances/${encodeURIComponent(instanceId)}/completions`)
    .then((r) => handle<{ instance_id: string; completed_task_ids: string[] }>(r, "That onboarding instance wasn't found."))
    .then((data) => data.completed_task_ids);
}

/** GET /api/v1/onboarding/instances/{id}/overdue - tasks past their expected window */
export function getOverdueTaskIds(instanceId: string): Promise<string[]> {
  return fetch(`${BASE_PATH}/instances/${encodeURIComponent(instanceId)}/overdue`)
    .then((r) => handle<{ instance_id: string; overdue_task_ids: string[] }>(r, "That onboarding instance wasn't found."))
    .then((data) => data.overdue_task_ids);
}

export interface TaskCompletionDetail {
  id: number;
  instance_id: string;
  task_id: string;
  completed_by: string | null;
  completed_at: string | null;
}

/** GET /api/v1/onboarding/instances/{id}/completion-details - real timestamps */
export function getCompletionDetails(instanceId: string): Promise<TaskCompletionDetail[]> {
  return fetch(`${BASE_PATH}/instances/${encodeURIComponent(instanceId)}/completion-details`).then(
    (r) => handle(r, "That onboarding instance wasn't found.")
  );
}

export interface CohortRow {
  instance_id: string;
  employee_id: string;
  employee_name: string;
  template_id: string;
  start_date: string;
  completion_pct: number;
  has_overdue_tasks: boolean;
}

/** GET /api/v1/onboarding/cohort?requester_id=... - Admin/HR-Restricted only */
export function getCohort(requesterId: string): Promise<CohortRow[]> {
  return fetch(`${BASE_PATH}/cohort?requester_id=${encodeURIComponent(requesterId)}`).then((r) =>
    handle(r, "Could not load the cohort view.")
  );
}

/** POST /api/v1/onboarding/completions - checked against the task's responsible_role */
export function completeTask(
  instanceId: string,
  taskId: string,
  completedBy: string
): Promise<TaskCompletion> {
  return fetch(`${BASE_PATH}/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instance_id: instanceId,
      task_id: taskId,
      completed_by: completedBy,
    }),
  }).then((r) => handle(r, "Could not mark the task complete."));
}