import { useState, type FormEvent } from "react";
import type { OnboardingInstance, OnboardingProgress, OnboardingTask, OnboardingTemplate, TaskCompletionDetail } from "../api";
import { ProgressBar } from "./ProgressBar";
import { Toast } from "../../../shared/components/Toast";
import { ROLE_LABELS } from "./TemplateBuilder";

interface InstanceTrackerProps {
  employees: { employee_id: string; name: string }[];
  templates: OnboardingTemplate[];
  tasksByTemplate: Record<string, OnboardingTask[]>;
  instance: OnboardingInstance | null;
  progress: OnboardingProgress | null;
  completedTaskIds: Set<string>;
  completionDetails: Record<string, TaskCompletionDetail>;
  overdueTaskIds: Set<string>;
  isTaskStateKnown: boolean;
  canManage: boolean;
  currentEmployeeId: string;
  onEmployeeChange: (employeeId: string) => void;
  onStart: (employeeId: string, templateId: string) => Promise<void>;
  onCompleteTask: (taskId: string) => Promise<void>;
  onReset: () => void;
}

export function InstanceTracker({
  employees,
  templates,
  tasksByTemplate,
  instance,
  progress,
  completedTaskIds,
  completionDetails,
  overdueTaskIds,
  isTaskStateKnown,
  canManage,
  currentEmployeeId,
  onEmployeeChange,
  onStart,
  onCompleteTask,
  onReset,
}: InstanceTrackerProps) {
  const [templateId, setTemplateId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleStart(e: FormEvent) {
    e.preventDefault();
    if (!currentEmployeeId || !templateId) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await onStart(currentEmployeeId, templateId);
      setTemplateId("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start onboarding.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const tasks = instance ? tasksByTemplate[instance.template_id] ?? [] : [];

  return (
    <div className="instance-tracker">
      <h3 className="directory-form__title">Track a new joiner</h3>
      {error && <Toast message={error} kind="error" onDismiss={() => setError(null)} />}
      {success && <Toast message="Onboarding instance created successfully." kind="success" onDismiss={() => setSuccess(false)} />}

    {instance ? (
        <div className="instance-tracker__viewing">
          <div className="instance-tracker__viewing-header">
            <div>
              <span className="field__label">Viewing</span>
              <div className="instance-tracker__viewing-name">
                {employees.find((e) => e.employee_id === instance.employee_id)?.name ?? instance.employee_id}
                {" "}
                <span className="directory-row__muted">({instance.employee_id})</span>
              </div>
            </div>
            <button
              className="button-secondary"
              style={{ fontSize: 12, padding: "7px 12px", whiteSpace: "nowrap" }}
              onClick={onReset}
            >
              Track another joiner
            </button>
          </div>
        </div>
      ) : canManage ? (
        <>
          <p className="instance-tracker__hint" style={{ marginBottom: 16 }}>
            Select an employee below to create a new onboarding instance for them.
          </p>
          <label className="field">
            <span className="field__label" style={{ color: "var(--color-ink)", fontWeight: 700 }}>Employee</span>
            <select
              className="field__input"
              value={currentEmployeeId}
              onChange={(e) => onEmployeeChange(e.target.value)}
            >
              <option value="">Choose employee…</option>
              {employees.map((e) => (
                <option key={e.employee_id} value={e.employee_id}>
                  {e.name} ({e.employee_id})
                </option>
              ))}
            </select>
          </label>
          {currentEmployeeId && (
            <form className="instance-tracker__start" onSubmit={handleStart}>
              <select
                className="field__input"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">Choose template…</option>
                {templates.map((t) => (
                  <option key={t.template_id} value={t.template_id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button className="button-primary" type="submit" disabled={isSubmitting}>
                Start onboarding
              </button>
            </form>
          )}
        </>
      ) : (
        <p className="directory-row__muted">
          Only Admin/Leadership may start a new onboarding instance. Use "Look up
          an existing instance" below to view or complete tasks on one already started.
        </p>
      )}
  
      {instance && progress && (
        <div className="instance-tracker__progress">
          <ProgressBar pct={progress.completion_pct} />
          <ul className="instance-tracker__tasks">
            {tasks
              .slice()
              .sort((a, b) => a.seq - b.seq)
              .map((task) => {
                const done = completedTaskIds.has(task.task_id);
                const overdue = overdueTaskIds.has(task.task_id);
                return (
                  <li key={task.task_id} className="instance-tracker__task">
                    {isTaskStateKnown ? (
                      <label className="instance-tracker__task-label">
                        <div className="instance-tracker__task-row">
                          <input
                            type="checkbox"
                            checked={done}
                            disabled={done}
                            onChange={() => onCompleteTask(task.task_id)}
                          />
                          <span className={done ? "instance-tracker__task-done" : ""}>{task.name}</span>
                          <span className="directory-row__muted"> · {ROLE_LABELS[task.responsible_role] ?? task.responsible_role}</span>
                          {overdue && !done && (
                            <span className="instance-tracker__overdue-badge">Overdue</span>
                          )}
                        </div>
                        {done && completionDetails[task.task_id]?.completed_at && (
                          <div className="instance-tracker__task-meta">
                            Completed {new Date(completionDetails[task.task_id].completed_at! + "Z").toLocaleString()}
                            {completionDetails[task.task_id]?.completed_by && ` by ${completionDetails[task.task_id].completed_by}`}
                          </div>
                        )}
                      </label>
                    ) : (
                      <div className="instance-tracker__task-unknown">
                        <span>
                          {task.name}
                          <span className="directory-row__muted"> · {ROLE_LABELS[task.responsible_role] ?? task.responsible_role}</span>
                        </span>
                        <button
                          className="button-secondary"
                          style={{ fontSize: 12, padding: "4px 10px" }}
                          onClick={() => onCompleteTask(task.task_id)}
                        >
                          Mark complete
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            {tasks.length === 0 && (
              <li className="directory-row__muted">This template has no tasks yet.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}