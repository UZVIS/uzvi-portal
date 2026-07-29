import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../shared/auth/AuthContext'
import { ConsultantUtilizationPage } from './ConsultantUtilizationPage'
import { ProjectMarginsPage } from './ProjectMarginsPage'
import { OrgDashboardPage } from './OrgDashboardPage'

type Tab = 'my' | 'margins' | 'org'

function isAdminTier(accessTier: string): boolean {
  return (accessTier || '').trim().toLowerCase().startsWith('admin')
}

export default function UtilizationModulePage() {
  const navigate = useNavigate()
  const { employee, logout } = useAuth()
  const [tab, setTab] = useState<Tab>('my')

  const isAdmin = employee ? isAdminTier(employee.access_tier) : false

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
        <button onClick={() => setTab('my')}>My Dashboard</button>
        {isAdmin && <button onClick={() => setTab('margins')}>Project Margins</button>}
        {isAdmin && <button onClick={() => setTab('org')}>Org Dashboard</button>}
      </nav>
      {tab === 'my' && <ConsultantUtilizationPage />}
      {tab === 'margins' && isAdmin && <ProjectMarginsPage />}
      {tab === 'org' && isAdmin && <OrgDashboardPage />}
      {(tab === 'margins' || tab === 'org') && !isAdmin && (
        <div style={{ padding: 24, color: '#6b7280' }}>
          This area is limited to Admin/Leadership accounts.
        </div>
      )}
    </div>
  )
}