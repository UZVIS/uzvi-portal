import { useState, type FormEvent } from "react";
import type { OnboardingTask, OnboardingTemplate } from "../api";

interface TemplateBuilderProps {
  templates: OnboardingTemplate[];
  tasksByTemplate: Record<string, OnboardingTask[]>;
  onCreateTemplate: (templateId: string, name: string) => Promise<void>;
  onAddTask: (input: {
    task_id: string;
    template_id: string;
    name: string;
    seq: number;
    responsible_role: string;
    expected_days?: number;
  }) => Promise<void>;
}

const ROLES = ["new_joiner", "hr", "it", "manager"];

export function TemplateBuilder({
  templates,
  tasksByTemplate,
  onCreateTemplate,
  onAddTask,
}: TemplateBuilderProps) {
  const [templateId, setTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [taskTemplateId, setTaskTemplateId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [taskName, setTaskName] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [expectedDays, setExpectedDays] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateTemplate(e: FormEvent) {
    e.preventDefault();
    if (!templateId.trim() || !templateName.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateTemplate(templateId.trim(), templateName.trim());
      setTemplateId("");
      setTemplateName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the template.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    if (!taskTemplateId || !taskId.trim() || !taskName.trim()) return;
    const existing = tasksByTemplate[taskTemplateId] ?? [];
    setIsSubmitting(true);
    setError(null);
    try {
      await onAddTask({
        task_id: taskId.trim(),
        template_id: taskTemplateId,
        name: taskName.trim(),
        seq: existing.length + 1,
        responsible_role: role,
        expected_days: expectedDays.trim() ? Number(expectedDays.trim()) : undefined,
      });
      setTaskId("");
      setTaskName("");
      setExpectedDays("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="template-builder">
      <h3 className="directory-form__title">Onboarding templates</h3>
      {error && <div className="error-banner">{error}</div>}

      <form className="template-builder__row" onSubmit={handleCreateTemplate}>
        <input
          className="field__input"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          placeholder="Template ID (TPL2)"
        />
        <input
          className="field__input"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Template name"
        />
        <button className="button-secondary" type="submit" disabled={isSubmitting}>
          Add template
        </button>
      </form>

      <ul className="template-builder__list">
        {templates.map((t) => (
          <li key={t.template_id} className="template-builder__template">
            <div className="template-builder__template-header">
              <strong>{t.name}</strong>
              <span className="team-manager__id">{t.template_id}</span>
            </div>
            <ol className="template-builder__tasks">
              {(tasksByTemplate[t.template_id] ?? []).map((task) => (
                <li key={task.task_id}>
                  {task.name} <span className="directory-row__muted">({task.responsible_role})</span>
                </li>
              ))}
              {(tasksByTemplate[t.template_id] ?? []).length === 0 && (
                <li className="directory-row__muted">No tasks yet.</li>
              )}
            </ol>
          </li>
        ))}
      </ul>

      <form className="template-builder__row" onSubmit={handleAddTask}>
        <select
          className="field__input"
          value={taskTemplateId}
          onChange={(e) => setTaskTemplateId(e.target.value)}
        >
          <option value="">Choose template…</option>
          {templates.map((t) => (
            <option key={t.template_id} value={t.template_id}>
              {t.name}
            </option>
          ))}
        </select>
        <input
          className="field__input"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          placeholder="Task ID"
        />
        <input
          className="field__input"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="Task name"
        />
        <select className="field__input" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          className="field__input"
          type="number"
          min="0"
          value={expectedDays}
          onChange={(e) => setExpectedDays(e.target.value)}
          placeholder="Days (optional)"
          style={{ maxWidth: 130 }}
        />
        <button className="button-secondary" type="submit" disabled={isSubmitting || !taskTemplateId}>
          Add task
        </button>
      </form>
    </div>
  );
}
