import { useState, type FormEvent } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";
import type { OnboardingTask, OnboardingTemplate } from "../api";
import { Toast } from "../../../shared/components/Toast";

interface TemplateBuilderProps {
  templates: OnboardingTemplate[];
  tasksByTemplate: Record<string, OnboardingTask[]>;
  onCreateTemplate: (name: string) => Promise<void>;
  onAddTask: (input: {
    template_id: string;
    name: string;
    seq: number;
    responsible_role: string;
    expected_days?: number;
    required_doc_type?: string;
  }) => Promise<void>;
  onUpdateTask: (
    taskId: string,
    input: {
      name?: string;
      responsible_role?: string;
      expected_days?: number;
      required_doc_type?: string;
    }
  ) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

const ROLES = ["new_joiner", "hr", "it", "manager"];
export const ROLE_LABELS: Record<string, string> = {
  new_joiner: "New Joiner",
  hr: "HR",
  it: "IT",
  manager: "Manager",
};

const DOC_TYPES = ["", "offer_letter", "payslip", "experience_letter", "id_proof", "address_proof"];

export function TemplateBuilder({
  templates,
  tasksByTemplate,
  onCreateTemplate,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: TemplateBuilderProps) {
  const [templateName, setTemplateName] = useState("");
  const [taskTemplateId, setTaskTemplateId] = useState("");
  const [taskName, setTaskName] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [expectedDays, setExpectedDays] = useState("");
  const [requiredDocType, setRequiredDocType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState(false);
  const [taskSuccess, setTaskSuccess] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState(ROLES[0]);
  const [editDays, setEditDays] = useState("");
  const [editDocType, setEditDocType] = useState("");

  async function handleCreateTemplate(e: FormEvent) {
    e.preventDefault();
    if (!templateName.trim()) return;
    setIsSubmitting(true);
    setError(null);
    setTemplateSuccess(false);
    try {
      await onCreateTemplate(templateName.trim());
      setTemplateName("");
      setTemplateSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the template.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    if (!taskTemplateId || !taskName.trim()) return;
    const existing = tasksByTemplate[taskTemplateId] ?? [];
    setIsSubmitting(true);
    setError(null);
    setTaskSuccess(false);
    try {
      await onAddTask({
        template_id: taskTemplateId,
        name: taskName.trim(),
        seq: existing.length + 1,
        responsible_role: role,
        expected_days: expectedDays.trim() ? Number(expectedDays.trim()) : undefined,
        required_doc_type: requiredDocType || undefined,
      });
      setTaskName("");
      setExpectedDays("");
      setRequiredDocType("");
      setTaskSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(task: OnboardingTask) {
    setEditingTaskId(task.task_id);
    setEditName(task.name);
    setEditRole(task.responsible_role);
    setEditDays(task.expected_days != null ? String(task.expected_days) : "");
    setEditDocType(task.required_doc_type ?? "");
    setError(null);
  }

  async function handleSaveEdit() {
    if (!editingTaskId || !editName.trim()) return;
    try {
      await onUpdateTask(editingTaskId, {
        name: editName.trim(),
        responsible_role: editRole,
        expected_days: editDays.trim() ? Number(editDays.trim()) : undefined,
        required_doc_type: editDocType || undefined,
      });
      setEditingTaskId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the task.");
    }
  }

  async function handleDelete(taskId: string) {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    try {
      await onDeleteTask(taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the task.");
    }
  }

  return (
    <div className="template-builder">
      <h3 className="directory-form__title">Onboarding templates</h3>
      {error && <Toast message={error} kind="error" onDismiss={() => setError(null)} />}
      {templateSuccess && <Toast message="Template created successfully." kind="success" onDismiss={() => setTemplateSuccess(false)} />}

      <form className="template-builder__row" onSubmit={handleCreateTemplate}>
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
              {(tasksByTemplate[t.template_id] ?? []).map((task) =>
                editingTaskId === task.task_id ? (
                  <li key={task.task_id} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", padding: "4px 0" }}>
                    <input
                      className="field__input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ maxWidth: 160 }}
                    />
                    <select className="field__input" value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ maxWidth: 110 }}>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                    <input
                      className="field__input"
                      type="number"
                      min="0"
                      value={editDays}
                      onChange={(e) => setEditDays(e.target.value)}
                      placeholder="Days"
                      style={{ maxWidth: 80 }}
                    />
                    <select className="field__input" value={editDocType} onChange={(e) => setEditDocType(e.target.value)} style={{ maxWidth: 140 }}>
                      {DOC_TYPES.map((d) => (
                        <option key={d} value={d}>{d ? d.replace(/_/g, " ") : "No document"}</option>
                      ))}
                    </select>
                    <button type="button" className="instance-tracker__doc-icon" onClick={handleSaveEdit} aria-label="Save" title="Save">
                      <Check size={14} />
                    </button>
                    <button type="button" className="instance-tracker__doc-icon" onClick={() => setEditingTaskId(null)} aria-label="Cancel" title="Cancel">
                      <X size={14} />
                    </button>
                  </li>
                ) : (
                  <li key={task.task_id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span>
                      {task.name} <span className="directory-row__muted">({ROLE_LABELS[task.responsible_role] ?? task.responsible_role})</span>
                    </span>
                    <button type="button" className="instance-tracker__doc-icon" onClick={() => startEdit(task)} aria-label="Edit task" title="Edit">
                      <Pencil size={13} />
                    </button>
                    <button type="button" className="instance-tracker__doc-icon" onClick={() => handleDelete(task.task_id)} aria-label="Delete task" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </li>
                )
              )}
              {(tasksByTemplate[t.template_id] ?? []).length === 0 && (
                <li className="directory-row__muted">No tasks yet.</li>
              )}
            </ol>
          </li>
        ))}
      </ul>

      {taskSuccess && <Toast message="Task added successfully." kind="success" onDismiss={() => setTaskSuccess(false)} />}
      <form className="template-builder__row" onSubmit={handleAddTask}>
        <select
          className="field__input"
          value={taskTemplateId}
          onChange={(e) => setTaskTemplateId(e.target.value)}
        >
          <option value="">Choose template...</option>
          {templates.map((t) => (
            <option key={t.template_id} value={t.template_id}>
              {t.name}
            </option>
          ))}
        </select>
        <input
          className="field__input"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="Task name"
        />
        <select className="field__input" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
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
        <select
          className="field__input"
          value={requiredDocType}
          onChange={(e) => setRequiredDocType(e.target.value)}
          style={{ maxWidth: 170 }}
        >
          <option value="">No document required</option>
          <option value="offer_letter">Requires: offer letter</option>
          <option value="payslip">Requires: payslip</option>
          <option value="experience_letter">Requires: experience letter</option>
          <option value="id_proof">Requires: id proof</option>
          <option value="address_proof">Requires: address proof</option>
        </select>
        <button className="button-secondary" type="submit" disabled={isSubmitting || !taskTemplateId}>
          Add task
        </button>
      </form>
    </div>
  );
}