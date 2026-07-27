import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/auth/AuthContext";
import { listActiveEmployees, type Employee } from "../directory/api";
import {
  listTemplates,
  listTasksForTemplate,
  createTemplate,
  addTask,
  startOnboarding,
  getInstance,
  getProgress,
  getCompletedTaskIds,
  getOverdueTaskIds,
  getCompletionDetails,
  completeTask,
  type TaskCompletionDetail,
  type OnboardingTemplate,
  type OnboardingTask,
  type OnboardingInstance,
  type OnboardingProgress,
} from "./api";
import { TemplateBuilder } from "./components/TemplateBuilder";
import { InstanceTracker } from "./components/InstanceTracker";
import { CohortView } from "./components/CohortView";
import "../shared-theme.css";
import "./OnboardingPage.css";

// only these tiers define templates and track cohorts.
const MANAGE_TIERS = new Set(["Admin/Leadership"]);

export function OnboardingPage() {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const canManage = employee ? MANAGE_TIERS.has(employee.access_tier) : false;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [tasksByTemplate, setTasksByTemplate] = useState<Record<string, OnboardingTask[]>>({});
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [instance, setInstance] = useState<OnboardingInstance | null>(null);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [overdueTaskIds, setOverdueTaskIds] = useState<Set<string>>(new Set());
  const [completionDetails, setCompletionDetails] = useState<Record<string, TaskCompletionDetail>>({});
  const [isTaskStateKnown, setIsTaskStateKnown] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [emps, tpls] = await Promise.all([listActiveEmployees(), listTemplates()]);
      setEmployees(emps);
      setTemplates(tpls);

      // Load tasks for every template so the checklist is ready once an
      // instance is started or looked up.
      const taskEntries = await Promise.all(
        tpls.map(async (t) => [t.template_id, await listTasksForTemplate(t.template_id)] as const)
      );
      setTasksByTemplate(Object.fromEntries(taskEntries));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load onboarding data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleCreateTemplate(templateId: string, name: string) {
    if (!employee) return;
    const t = await createTemplate(templateId, name, employee.employee_id);
    setTemplates((prev) => [...prev, t]);
  }

  async function handleAddTask(input: {
    task_id: string;
    template_id: string;
    name: string;
    seq: number;
    responsible_role: string;
    expected_days?: number;
    required_doc_type?: string;
  }) {
    if (!employee) return;
    const task = await addTask({ ...input, requester_id: employee.employee_id });
    setTasksByTemplate((prev) => ({
      ...prev,
      [input.template_id]: [...(prev[input.template_id] ?? []), task],
    }));
  }

  function handleEmployeeChange(employeeId: string) {
    setSelectedEmployeeId(employeeId);
    setInstance(null);
    setProgress(null);
    setCompletedTaskIds(new Set());
    setOverdueTaskIds(new Set());
    setCompletionDetails({});
    setIsTaskStateKnown(true);
    setError(null);
  }

  async function handleStart(instanceId: string, employeeId: string, templateId: string) {
    if (!employee) return;
    const created = await startOnboarding(instanceId, employeeId, templateId, employee.employee_id);
    setInstance(created);
    setIsTaskStateKnown(true);
    const [prog, overdueIds, details] = await Promise.all([
      getProgress(created.instance_id),
      getOverdueTaskIds(created.instance_id),
      getCompletionDetails(created.instance_id),
    ]);
    setProgress(prog);
    setOverdueTaskIds(new Set(overdueIds));
    setCompletionDetails(Object.fromEntries(details.map((d) => [d.task_id, d])));
  }

  async function handleCompleteTask(taskId: string) {

    if (!instance || !employee) return;
    try {
      await completeTask(instance.instance_id, taskId, employee.employee_id);
      setCompletedTaskIds((prev) => new Set(prev).add(taskId));
      const [prog, overdueIds, details] = await Promise.all([
        getProgress(instance.instance_id),
        getOverdueTaskIds(instance.instance_id),
        getCompletionDetails(instance.instance_id),
      ]);
      setProgress(prog);
      setOverdueTaskIds(new Set(overdueIds));
      setCompletionDetails(Object.fromEntries(details.map((d) => [d.task_id, d])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark the task complete.");
    }
  }

  async function handleLookupExisting(instanceId: string) {
    setError(null);
    try {
      const found = await getInstance(instanceId);
      setInstance(found);
      const [prog, doneIds, overdueIds, details] = await Promise.all([
        getProgress(instanceId),
        getCompletedTaskIds(instanceId),
        getOverdueTaskIds(instanceId),
        getCompletionDetails(instanceId),
      ]);
      setProgress(prog);
      setCompletedTaskIds(new Set(doneIds));
      setOverdueTaskIds(new Set(overdueIds));
      setCompletionDetails(Object.fromEntries(details.map((d) => [d.task_id, d])));
      setIsTaskStateKnown(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That onboarding instance wasn't found.");
    }
  }

  return (
    <div className="directory-page uzvi-portal-theme">
      <header className="directory-page__header">
        <div>
          <button className="button-secondary" onClick={() => navigate("/")}>
            ← Modules
          </button>
          <h1>Onboarding</h1>
          <p className="directory-page__subtitle">
            Structured checklists for new joiners — build a template once, track every new hire against it.
          </p>
        </div>
        {employee && (
          <div className="directory-page__me">
            <div className="directory-page__me-avatar">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div className="directory-page__me-info">
              <span className="directory-page__me-name">{employee.name}</span>
              <span className="directory-page__me-tier">{employee.access_tier}</span>
            </div>
            <button className="button-secondary" onClick={logout}>
              Log out
            </button>
          </div>
        )}
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="directory-page__manage">
        {canManage && (
          <TemplateBuilder
            templates={templates}
            tasksByTemplate={tasksByTemplate}
            onCreateTemplate={handleCreateTemplate}
            onAddTask={handleAddTask}
          />
        )}
        <InstanceTracker
          employees={employees.map((e) => ({ employee_id: e.employee_id, name: e.name }))}
          templates={templates}
          tasksByTemplate={tasksByTemplate}
          instance={instance}
          progress={progress}
          completedTaskIds={completedTaskIds}
          completionDetails={completionDetails}
          overdueTaskIds={overdueTaskIds}
          isTaskStateKnown={isTaskStateKnown}
          currentEmployeeId={selectedEmployeeId}
          onEmployeeChange={handleEmployeeChange}
          onStart={handleStart}
          onCompleteTask={handleCompleteTask}
          canManage={canManage}
        />
      </section>

      <section className="directory-page__list">
        <h2 style={{ fontSize: 16, fontFamily: "var(--font-display)", marginBottom: 12 }}>
          Look up an existing instance
        </h2>
        <LookupForm onLookup={handleLookupExisting} />
        {isLoading && <p className="directory-row__muted">Loading…</p>}
      </section>

      {canManage && employee && (
        <section className="directory-page__list">
          <h2 style={{ fontSize: 16, fontFamily: "var(--font-display)", marginBottom: 12 }}>
            Cohort view — all current joiners
          </h2>
          <CohortView requesterId={employee.employee_id} />
        </section>
      )}
    </div>
  );
}

function LookupForm({ onLookup }: { onLookup: (instanceId: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="template-builder__row"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onLookup(value.trim());
      }}
    >
      <input
        className="field__input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Instance ID (OI1)"
      />
      <button className="button-secondary" type="submit">
        Look up
      </button>
    </form>
  );
}