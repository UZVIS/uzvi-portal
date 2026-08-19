import type { Employee } from "../api";

interface OrgChartViewProps {
  employees: Employee[];
}

const TIER_LABELS: Record<string, string> = {
  "Admin/Leadership": "Admin",
  "HR-Restricted": "HR",
  "Manager": "Manager",
  "Employee": "Employee",
};

export function OrgChartView({ employees }: OrgChartViewProps) {
  const childrenOf: Record<string, Employee[]> = {};
  const roots: Employee[] = [];

  for (const e of employees) {
    if (e.manager_id && employees.some((m) => m.employee_id === e.manager_id)) {
      (childrenOf[e.manager_id] ??= []).push(e);
    } else {
      roots.push(e);
    }
  }

  if (roots.length === 0) {
    return <p className="directory-row__muted">No reporting lines yet — set a reporting manager on an employee to see the chart.</p>;
  }

  return (
    <ul className="org-chart">
      {roots.map((r) => (
        <OrgChartNode key={r.employee_id} employee={r} childrenOf={childrenOf} />
      ))}
    </ul>
  );
}

function OrgChartNode({
  employee,
  childrenOf,
}: {
  employee: Employee;
  childrenOf: Record<string, Employee[]>;
}) {
  const kids = childrenOf[employee.employee_id] ?? [];
  return (
    <li className="org-chart__node">
      <div className="org-chart__card">
        <span className="org-chart__name">{employee.name}</span>
        <span className="directory-row__muted"> ({employee.employee_id})</span>
        <span className="directory-row__muted"> · {TIER_LABELS[employee.access_tier] ?? employee.access_tier}</span>
      </div>
      {kids.length > 0 && (
        <ul>
          {kids.map((k) => (
            <OrgChartNode key={k.employee_id} employee={k} childrenOf={childrenOf} />
          ))}
        </ul>
      )}
    </li>
  );
}