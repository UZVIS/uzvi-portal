/**
 * M4 - Expense Claims
 * frontend/src/modules/expense_claims/ExpenseClaimsModulePage.tsx
 *
 * Wraps the 3 M4 views (My Claims, Approvals, Project Rollup) under the
 * single /expenses route that modules.data.ts registers for M4.
 */
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ExpenseClaimsPage } from './ExpenseClaimsPage'
import { ApprovalsPage } from './ApprovalsPage'
import { ProjectRollupPage } from './ProjectRollupPage'

type Tab = 'my' | 'approvals' | 'rollup'

export default function ExpenseClaimsModulePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('my')

  return (
    <div>
      <div style={{ padding: '12px 24px', borderBottom: '1px solid #e3e6ea' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
          ← Directory
        </button>
      </div>
      <nav style={{ display: 'flex', gap: 8, padding: '12px 24px', borderBottom: '1px solid #e3e6ea' }}>
        <button onClick={() => setTab('my')}>My Claims</button>
        <button onClick={() => setTab('approvals')}>Approvals</button>
        <button onClick={() => setTab('rollup')}>Project Rollup</button>
      </nav>
      {tab === 'my' && <ExpenseClaimsPage />}
      {tab === 'approvals' && <ApprovalsPage />}
      {tab === 'rollup' && <ProjectRollupPage />}
    </div>
  )
}
