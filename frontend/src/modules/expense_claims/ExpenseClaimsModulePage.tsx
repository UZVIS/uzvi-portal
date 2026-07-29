import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../shared/auth/AuthContext'
import { ExpenseClaimsPage } from './ExpenseClaimsPage'
import { ApprovalsPage } from './ApprovalsPage'
import { ProjectRollupPage } from './ProjectRollupPage'

type Tab = 'my' | 'approvals' | 'rollup'

const APPROVAL_TIERS = ['manager', 'admin/leadership', 'hr-restricted']

function canApprove(accessTier: string): boolean {
  return APPROVAL_TIERS.includes((accessTier || '').trim().toLowerCase())
}

export default function ExpenseClaimsModulePage() {
  const navigate = useNavigate()
  const { employee, logout } = useAuth()
  const [tab, setTab] = useState<Tab>('my')

  const canSeePrivileged = employee ? canApprove(employee.access_tier) : false

  function handleSignOut() {
    logout()
    navigate('/login', { replace: true, state: null })
  }

  return (
    <div style={{ background: '#f7f5f2', minHeight: '100vh' }}>
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid #e3e6ea',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
          ← Directory
        </button>
        <button
          onClick={handleSignOut}
          style={{
            background: 'none',
            border: '1px solid #d0d0d0',
            borderRadius: 6,
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
      <nav style={{ display: 'flex', gap: 8, padding: '12px 24px', borderBottom: '1px solid #e3e6ea' }}>
        <button onClick={() => setTab('my')}>My Claims</button>
        {canSeePrivileged && <button onClick={() => setTab('approvals')}>Approvals</button>}
        {canSeePrivileged && <button onClick={() => setTab('rollup')}>Project Rollup</button>}
      </nav>
      {tab === 'my' && <ExpenseClaimsPage />}
      {tab === 'approvals' && canSeePrivileged && <ApprovalsPage />}
      {tab === 'approvals' && !canSeePrivileged && (
        <div style={{ padding: 24, color: '#6b7280' }}>
          This area is limited to Manager, Admin/Leadership, or HR-Restricted accounts.
        </div>
      )}
      {tab === 'rollup' && canSeePrivileged && <ProjectRollupPage />}
      {tab === 'rollup' && !canSeePrivileged && (
        <div style={{ padding: 24, color: '#6b7280' }}>
          This area is limited to Manager, Admin/Leadership, or HR-Restricted accounts.
        </div>
      )}
    </div>
  )
}