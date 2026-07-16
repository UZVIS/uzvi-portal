
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ConsultantUtilizationPage } from './ConsultantUtilizationPage'
import { ProjectMarginsPage } from './ProjectMarginsPage'
import { OrgDashboardPage } from './OrgDashboardPage'

type Tab = 'my' | 'margins' | 'org'

export default function UtilizationModulePage() {
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
        <button onClick={() => setTab('my')}>My Dashboard</button>
        <button onClick={() => setTab('margins')}>Project Margins</button>
        <button onClick={() => setTab('org')}>Org Dashboard</button>
      </nav>
      {tab === 'my' && <ConsultantUtilizationPage />}
      {tab === 'margins' && <ProjectMarginsPage />}
      {tab === 'org' && <OrgDashboardPage />}
    </div>
  )
}
