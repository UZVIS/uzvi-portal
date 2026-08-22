// import { useNavigate } from 'react-router-dom'
// import { useState, type CSSProperties } from 'react'
// import { useAuth } from '../../shared/auth/AuthContext'
// import { ExpenseClaimsPage } from './ExpenseClaimsPage'
// import { ApprovalsPage } from './ApprovalsPage'
// import { ProjectRollupPage } from './ProjectRollupPage'

// type Tab = 'my' | 'approvals' | 'rollup'

// const APPROVAL_TIERS = ['manager', 'admin/leadership', 'hr-restricted']

// function canApprove(accessTier: string): boolean {
//   return APPROVAL_TIERS.includes((accessTier || '').trim().toLowerCase())
// }


// function tabButtonStyle(active: boolean): CSSProperties {
//   return {
//     background: active ? '#F37021' : '#ffffff',
//     color: active ? '#ffffff' : '#1f2430',
//     border: '1px solid ' + (active ? '#F37021' : '#d0d0d0'),
//     borderRadius: 6,
//     padding: '6px 14px',
//     cursor: 'pointer',
//     fontWeight: 600,
//     fontSize: 14,
//   }
// }

// export default function ExpenseClaimsModulePage() {
//   const navigate = useNavigate()
//   const { employee } = useAuth()
//   const [tab, setTab] = useState<Tab>('my')

//   const canSeePrivileged = employee ? canApprove(employee.access_tier) : false

//   return (
//     <div style={{ background: '#f7f5f2', minHeight: '100vh' }}>
//       <div
//         style={{
//           padding: '12px 24px',
//           borderBottom: '1px solid #e3e6ea',
//         }}
//       >
//         <button
//           onClick={() => navigate(-1)}
//           style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
//         >
//           ← Back
//         </button>
//       </div>
//       <nav style={{ display: 'flex', gap: 8, padding: '12px 24px', borderBottom: '1px solid #e3e6ea' }}>
//         <button onClick={() => setTab('my')} style={tabButtonStyle(tab === 'my')}>
//           My Claims
//         </button>
//         {canSeePrivileged && (
//           <button onClick={() => setTab('approvals')} style={tabButtonStyle(tab === 'approvals')}>
//             Approvals
//           </button>
//         )}
//         {canSeePrivileged && (
//           <button onClick={() => setTab('rollup')} style={tabButtonStyle(tab === 'rollup')}>
//             Project Rollup
//           </button>
//         )}
//       </nav>
//       {tab === 'my' && <ExpenseClaimsPage />}
//       {tab === 'approvals' && canSeePrivileged && <ApprovalsPage />}
//       {tab === 'approvals' && !canSeePrivileged && (
//         <div style={{ padding: 24, color: '#6b7280' }}>
//           This area is limited to Manager, Admin/Leadership, or HR-Restricted accounts.
//         </div>
//       )}
//       {tab === 'rollup' && canSeePrivileged && <ProjectRollupPage />}
//       {tab === 'rollup' && !canSeePrivileged && (
//         <div style={{ padding: 24, color: '#6b7280' }}>
//           This area is limited to Manager, Admin/Leadership, or HR-Restricted accounts.
//         </div>
//       )}
//     </div>
//   )
// }


import { useState, type CSSProperties } from 'react'
import { useAuth } from '../../shared/auth/AuthContext'
import { ExpenseClaimsPage } from './ExpenseClaimsPage'
import { ApprovalsPage } from './ApprovalsPage'
import { ProjectRollupPage } from './ProjectRollupPage'

type Tab = 'my' | 'approvals' | 'rollup'

// ============================================================
// ROLE PERMISSIONS
// ============================================================

const APPROVAL_TIERS = [
  'manager',
  'admin/leadership',
]

const ROLLUP_TIERS = [
  'manager',
  'admin/leadership',
  'hr-restricted',
]

function hasRole(
  accessTier: string | undefined,
  allowedTiers: string[]
): boolean {
  if (!accessTier) {
    return false
  }

  return allowedTiers.includes(
    accessTier.trim().toLowerCase()
  )
}

// ============================================================
// TAB BUTTON STYLE
// ============================================================

function tabButtonStyle(
  active: boolean
): CSSProperties {
  return {
    background: active
      ? '#F37021'
      : '#ffffff',

    color: active
      ? '#ffffff'
      : '#1f2430',

    border:
      '1px solid ' +
      (active
        ? '#F37021'
        : '#d0d0d0'),

    borderRadius: 6,

    padding: '6px 14px',

    cursor: 'pointer',

    fontWeight: 600,

    fontSize: 14,
  }
}

// ============================================================
// EXPENSE CLAIMS MODULE
// ============================================================

export default function ExpenseClaimsModulePage() {
  const { employee } = useAuth()

  const [tab, setTab] =
    useState<Tab>('my')

  // ----------------------------------------------------------
  // PERMISSIONS
  // ----------------------------------------------------------

  const canSeeApprovals =
    employee
      ? hasRole(
          employee.access_tier,
          APPROVAL_TIERS
        )
      : false

  const canSeeRollup =
    employee
      ? hasRole(
          employee.access_tier,
          ROLLUP_TIERS
        )
      : false

  // ----------------------------------------------------------
  // PAGE
  // ----------------------------------------------------------

  return (
    <div>

      {/* ======================================================
          NAVIGATION
          ====================================================== */}

      <nav
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
        }}
      >

        {/* ----------------------------------------------------
            MY CLAIMS
            Everyone can see My Claims
            ---------------------------------------------------- */}

        <button
          onClick={() =>
            setTab('my')
          }
          style={tabButtonStyle(
            tab === 'my'
          )}
        >
          My Claims
        </button>


        {/* ----------------------------------------------------
            APPROVALS
            ONLY:
              Manager
              Admin/Leadership

            HR-Restricted DOES NOT see this tab.
            ---------------------------------------------------- */}

        {canSeeApprovals && (
          <button
            onClick={() =>
              setTab('approvals')
            }
            style={tabButtonStyle(
              tab === 'approvals'
            )}
          >
            Approvals
          </button>
        )}


        {/* ----------------------------------------------------
            PROJECT ROLLUP
            Manager
            Admin/Leadership
            HR-Restricted
            ---------------------------------------------------- */}

        {canSeeRollup && (
          <button
            onClick={() =>
              setTab('rollup')
            }
            style={tabButtonStyle(
              tab === 'rollup'
            )}
          >
            Project Rollup
          </button>
        )}

      </nav>


      {/* ======================================================
          MY CLAIMS
          ====================================================== */}

      {tab === 'my' && (
        <ExpenseClaimsPage />
      )}


      {/* ======================================================
          APPROVALS
          Only Manager/Admin can access.
          ====================================================== */}

      {tab === 'approvals' &&
        canSeeApprovals && (
          <ApprovalsPage />
        )}


      {/* ======================================================
          PROJECT ROLLUP
          Manager/Admin/HR can access.
          ====================================================== */}

      {tab === 'rollup' &&
        canSeeRollup && (
          <ProjectRollupPage />
        )}

    </div>
  )
}