import { useNavigate } from 'react-router-dom'
import { useState, type CSSProperties } from 'react'
import { useAuth } from '../../shared/auth/AuthContext'
import { ConsultantUtilizationPage } from './ConsultantUtilizationPage'
import { ProjectMarginsPage } from './ProjectMarginsPage'
import { OrgDashboardPage } from './OrgDashboardPage'

type Tab = 'my' | 'margins' | 'org'

function isAdminTier(accessTier: string): boolean {
  return (accessTier || '').trim().toLowerCase().startsWith('admin')
}

function tabButtonStyle(active: boolean): CSSProperties {
  return {
    background: active ? '#F37021' : '#ffffff',
    color: active ? '#ffffff' : '#1f2430',
    border: '1px solid ' + (active ? '#F37021' : '#d0d0d0'),
    borderRadius: 6,
    padding: '6px 14px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
  }
}

export default function UtilizationModulePage() {
  const navigate = useNavigate()
  const { employee } = useAuth()
  const [tab, setTab] = useState<Tab>('my')

  const isAdmin = employee ? isAdminTier(employee.access_tier) : false

  return (
    <div style={{ background: '#f7f5f2', minHeight: '100vh' }}>
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid #e3e6ea',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
        >
          ← Back
        </button>
      </div>
      <nav style={{ display: 'flex', gap: 8, padding: '12px 24px', borderBottom: '1px solid #e3e6ea' }}>
        <button onClick={() => setTab('my')} style={tabButtonStyle(tab === 'my')}>
          My Dashboard
        </button>
        {isAdmin && (
          <button onClick={() => setTab('margins')} style={tabButtonStyle(tab === 'margins')}>
            Project Margins
          </button>
        )}
        {isAdmin && (
          <button onClick={() => setTab('org')} style={tabButtonStyle(tab === 'org')}>
            Org Dashboard
          </button>
        )}
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