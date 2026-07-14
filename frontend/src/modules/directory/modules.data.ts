export interface ModuleInfo {
  id: string;
  name: string;
  slug: string;
  prefix: string;
  purpose: string;
}

export const foundation: ModuleInfo = {
  id: 'M0',
  name: 'Employee Directory & Identity',
  slug: 'directory',
  prefix: '/directory',
  purpose:
    'The single source of truth every other module references. Core employee records, access tiers, and the org directory live here.',
};

export const modules: ModuleInfo[] = [
  {
    id: 'M1',
    name: 'Consultant Utilization Tracker',
    slug: 'utilization',
    prefix: '/utilization',
    purpose: 'Track consultant hours, utilization %, and project margins.',
  },
  {
    id: 'M2',
    name: 'Leave Management',
    slug: 'leave',
    prefix: '/leave',
    purpose:
      'Leave application, approval, and balance tracking, compliant with Indian statutory frameworks.',
  },
  {
    id: 'M3',
    name: 'Attendance Tracker',
    slug: 'attendance',
    prefix: '/attendance',
    purpose: 'Daily presence tracking and monthly attendance summaries.',
  },
  {
    id: 'M4',
    name: 'Expense Claims',
    slug: 'expenses',
    prefix: '/expenses',
    purpose: 'Expense submission, approval, and reimbursement status tracking.',
  },
  {
    id: 'M5',
    name: 'Onboarding / New Joiner Tracker',
    slug: 'onboarding',
    prefix: '/onboarding',
    purpose: 'Track each new hire through a structured onboarding checklist.',
  },
  {
    id: 'M6',
    name: 'Training / Learning Progress Tracker',
    slug: 'training',
    prefix: '/training',
    purpose: 'Track employee progress through training curricula.',
  },
  {
    id: 'M7',
    name: 'Asset Management',
    slug: 'assets',
    prefix: '/assets',
    purpose: 'Track company asset issuance and return per employee.',
  },
  {
    id: 'M8',
    name: 'Document Repository',
    slug: 'documents',
    prefix: '/documents',
    purpose:
      'Self-service access to personal HR documents and secure identity-document storage.',
  },
  {
    id: 'M9',
    name: 'Announcements / Notice Board',
    slug: 'announcements',
    prefix: '/announcements',
    purpose: 'Company-wide or team-targeted announcements.',
  },
  {
    id: 'M10',
    name: 'Performance & Goals Tracker',
    slug: 'performance',
    prefix: '/performance',
    purpose: 'Quarterly goal-setting, self-assessment, and manager review status.',
  },
  {
    id: 'M11',
    name: 'HR / IT Helpdesk',
    slug: 'helpdesk',
    prefix: '/helpdesk',
    purpose: 'Raise and track internal HR, IT, and facilities support tickets.',
  },
  {
    id: 'M12',
    name: 'Recruiting / Candidate Pipeline',
    slug: 'recruiting',
    prefix: '/recruiting',
    purpose: 'Structured tracking of candidates across the hiring pipeline.',
  },
  {
    id: 'M13',
    name: 'Quote & Tender Calculator',
    slug: 'quotes',
    prefix: '/quotes',
    purpose: 'Repeatable commercial structuring for client quotes and formal tenders.',
  },
  {
    id: 'M14',
    name: 'Company Calendar',
    slug: 'calendar',
    prefix: '/calendar',
    purpose:
      'Central calendar of holidays, company events, and an approved-leave overlay.',
  },
];

export const allModules: ModuleInfo[] = [foundation, ...modules];