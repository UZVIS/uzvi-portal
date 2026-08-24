

// // import { useEffect, useState } from "react";
// // import { expenseClaimsApi, type ExpenseCategory, type ExpenseClaim } from "./api";
// // import { useAuth } from "../../shared/auth/AuthContext";
// // import "./ApprovalsPage.css";

// // const APPROVER_TIERS = new Set(["Manager", "Admin/Leadership", "HR-Restricted"]);


// // function formatDecidedAt(isoTimestamp: string): string {
// //   const d = new Date(isoTimestamp);
// //   if (Number.isNaN(d.getTime())) return "";
// //   return d.toLocaleString(undefined, {
// //     year: "numeric",
// //     month: "short",
// //     day: "numeric",
// //     hour: "2-digit",
// //     minute: "2-digit",
// //   });
// // }

// // export function ApprovalsPage() {
// //   const { employee } = useAuth();
// //   const [claims, setClaims] = useState<ExpenseClaim[]>([]);
// //   const [categories, setCategories] = useState<ExpenseCategory[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [loadError, setLoadError] = useState<string | null>(null);
// //   const [actionError, setActionError] = useState<string | null>(null);


// //   const canAct = employee ? APPROVER_TIERS.has(employee.access_tier) : false;

// //   async function loadAll() {
// //     const [claimList, categoryList] = await Promise.all([
// //       expenseClaimsApi.listClaims(),
// //       expenseClaimsApi.listCategories(),
// //     ]);
// //     setClaims(claimList);
// //     setCategories(categoryList);
// //   }

// //   useEffect(() => {
// //     setLoading(true);
// //     loadAll()
// //       .catch((err) => setLoadError(err instanceof Error ? err.message : "Couldn't load claims."))
// //       .finally(() => setLoading(false));
// //   }, []);

// //   async function handleApprove(claimId: string) {
// //     setActionError(null);
// //     try {
// //       await expenseClaimsApi.approveClaim(claimId);
// //       await loadAll();
// //     } catch (err) {
// //       setActionError(err instanceof Error ? err.message : "Couldn't approve this claim.");
// //     }
// //   }

// //   async function handleReject(claimId: string) {
// //     setActionError(null);
// //     try {
// //       await expenseClaimsApi.rejectClaim(claimId);
// //       await loadAll();
// //     } catch (err) {
// //       setActionError(err instanceof Error ? err.message : "Couldn't reject this claim.");
// //     }
// //   }

// //   async function handleReimburse(claimId: string) {
// //     setActionError(null);
// //     try {
// //       await expenseClaimsApi.reimburseClaim(claimId);
// //       await loadAll();
// //     } catch (err) {
// //       setActionError(err instanceof Error ? err.message : "Couldn't mark this claim reimbursed.");
// //     }
// //   }

// //   if (loading) {
// //     return <div className="ap-page ap-page--status">Loading claims…</div>;
// //   }

// //   if (loadError) {
// //     return <div className="ap-page ap-page--status ap-page--error">Couldn't load this page: {loadError}</div>;
// //   }

// //   return (
// //     <div className="ap-page">
// //       <h1 className="ap-page__title">Approvals</h1>
// //       <p className="ap-page__subtitle">
// //         Role-restricted per NFR-SEC-01: the backend checks your real access_tier from the Employee
// //         Directory (M0) on every action - claims above the admin threshold need Admin/HR-Restricted,
// //         not Manager.
// //       </p>

// //       <p className="ap-page__acting">
// //         Signed in as: <strong>{employee?.name ?? employee?.employee_id}</strong> ({employee?.access_tier})
// //         {!canAct && (
// //           <span className="ap-page__acting-note"> — this account can view claims but cannot act on them.</span>
// //         )}
// //       </p>

// //       {actionError && <p className="ap-page__error">{actionError}</p>}

// //       {claims.length === 0 ? (
// //         <p className="ap-page__empty">No claims in the system yet.</p>
// //       ) : (
// //         <div className="ap-table-wrap">
// //         <table className="ap-table">
// //           <thead>
// //             <tr>
// //               <th>ID</th>
// //               <th>Name</th>
// //               <th>Category</th>
// //               <th>Amount</th>
// //               <th>Date</th>
// //               <th>Status</th>
// //               <th>Decided by</th>
// //               <th>Actions</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {claims.map((claim) => (
// //               <tr key={claim.claim_id}>
// //                 <td>{claim.employee_id}</td>
// //                 <td>{claim.employee_name ?? "—"}</td>
// //                 <td>{categories.find((c) => c.category_id === claim.category_id)?.name ?? claim.category_id}</td>
// //                 <td>₹{claim.amount.toLocaleString()}</td>
// //                 <td>{claim.date}</td>
// //                 <td>
// //                   <span className={`ap-badge ap-badge--${claim.status.toLowerCase()}`}>{claim.status}</span>
// //                 </td>
// //                 <td>
// //                   {claim.decided_by_role ? (
// //                     <span className="ap-decided-by">
// //                       {claim.status === "Rejected" ? "Rejected" : "Approved"} by{" "}
// //                       {claim.decided_by_name ?? claim.decided_by_role}
// //                       {claim.decided_at && (
// //                         <>
// //                           <br />
// //                           <span className="ap-decided-by__time">{formatDecidedAt(claim.decided_at)}</span>
// //                         </>
// //                       )}
// //                     </span>
// //                   ) : (
// //                     <span className="ap-table__done">—</span>
// //                   )}
// //                 </td>
// //                 <td className="ap-table__actions">
// //                   {claim.status === "Submitted" && canAct && (
// //                     <>
// //                       <button className="ap-btn ap-btn--approve" onClick={() => handleApprove(claim.claim_id)}>
// //                         Approve
// //                       </button>
// //                       <button className="ap-btn ap-btn--reject" onClick={() => handleReject(claim.claim_id)}>
// //                         Reject
// //                       </button>
// //                     </>
// //                   )}
// //                   {claim.status === "Approved" && canAct && (
// //                     <button className="ap-btn ap-btn--reimburse" onClick={() => handleReimburse(claim.claim_id)}>
// //                       Mark reimbursed
// //                     </button>
// //                   )}
// //                   {(claim.status === "Rejected" ||
// //                     claim.status === "Reimbursed" ||
// //                     ((claim.status === "Submitted" || claim.status === "Approved") && !canAct)) && (
// //                     <span className="ap-table__done">—</span>
// //                   )}
// //                 </td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </table>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }


// import { useEffect, useState } from "react";

// import {
//   expenseClaimsApi,
//   type ExpenseCategory,
//   type ExpenseClaim,
// } from "./api";

// import { useAuth } from "../../shared/auth/AuthContext";

// import "./ApprovalsPage.css";


// const APPROVER_TIERS = new Set([
//   "Manager",
//   "Admin/Leadership",
//   "HR-Restricted",
// ]);


// function formatDecidedAt(
//   isoTimestamp: string
// ): string {

//   const d = new Date(
//     isoTimestamp
//   );

//   if (Number.isNaN(d.getTime())) {
//     return "";
//   }

//   return d.toLocaleString(
//     undefined,
//     {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     }
//   );
// }


// export function ApprovalsPage() {

//   const { employee } = useAuth();

//   const [claims, setClaims] =
//     useState<ExpenseClaim[]>([]);

//   const [categories, setCategories] =
//     useState<ExpenseCategory[]>([]);

//   const [loading, setLoading] =
//     useState(true);

//   const [loadError, setLoadError] =
//     useState<string | null>(null);

//   const [actionError, setActionError] =
//     useState<string | null>(null);


//   const canAct = employee
//     ? APPROVER_TIERS.has(
//         employee.access_tier
//       )
//     : false;


//   async function loadAll() {

//     /*
//      * IMPORTANT:
//      *
//      * Do NOT call listClaims() here.
//      *
//      * The normal /claims endpoint returns
//      * general claims.
//      *
//      * The /claims/approvals endpoint applies
//      * the backend approval hierarchy:
//      *
//      * <= ₹25,000:
//      *     reporting manager only
//      *
//      * > ₹25,000:
//      *     Admin/HR only
//      */

//     const [
//       claimList,
//       categoryList,
//     ] = await Promise.all([
//       expenseClaimsApi.listApprovalClaims(),
//       expenseClaimsApi.listCategories(),
//     ]);

//     setClaims(claimList);
//     setCategories(categoryList);
//   }


//   useEffect(() => {

//     setLoading(true);

//     loadAll()
//       .catch(
//         (err) =>
//           setLoadError(
//             err instanceof Error
//               ? err.message
//               : "Couldn't load claims."
//           )
//       )
//       .finally(
//         () => setLoading(false)
//       );

//   }, []);


//   async function handleApprove(
//     claimId: string
//   ) {

//     setActionError(null);

//     try {

//       await expenseClaimsApi.approveClaim(
//         claimId
//       );

//       await loadAll();

//     } catch (err) {

//       setActionError(
//         err instanceof Error
//           ? err.message
//           : "Couldn't approve this claim."
//       );
//     }
//   }


//   async function handleReject(
//     claimId: string
//   ) {

//     setActionError(null);

//     try {

//       await expenseClaimsApi.rejectClaim(
//         claimId
//       );

//       await loadAll();

//     } catch (err) {

//       setActionError(
//         err instanceof Error
//           ? err.message
//           : "Couldn't reject this claim."
//       );
//     }
//   }


//   async function handleReimburse(
//     claimId: string
//   ) {

//     setActionError(null);

//     try {

//       await expenseClaimsApi.reimburseClaim(
//         claimId
//       );

//       await loadAll();

//     } catch (err) {

//       setActionError(
//         err instanceof Error
//           ? err.message
//           : "Couldn't mark this claim reimbursed."
//       );
//     }
//   }


//   if (loading) {

//     return (
//       <div className="ap-page ap-page--status">
//         Loading claims…
//       </div>
//     );
//   }


//   if (loadError) {

//     return (
//       <div className="ap-page ap-page--status ap-page--error">
//         Couldn't load this page: {loadError}
//       </div>
//     );
//   }


//   return (
//     <div className="ap-page">

//       <h1 className="ap-page__title">
//         Approvals
//       </h1>


//       <p className="ap-page__subtitle">

//         Approval rules:

//         <strong>
//           {" "}Claims up to ₹25,000 go only to
//           the employee's reporting manager.
//         </strong>

//         {" "}Claims above ₹25,000 go only to
//         Admin/HR-Restricted.

//         The backend enforces these rules
//         on every action.

//       </p>


//       <p className="ap-page__acting">

//         Signed in as:

//         {" "}

//         <strong>
//           {employee?.name ??
//             employee?.employee_id}
//         </strong>

//         {" "}

//         ({employee?.access_tier})


//         {!canAct && (
//           <span className="ap-page__acting-note">

//             {" "}— this account can view claims
//             but cannot act on them.

//           </span>
//         )}

//       </p>


//       {actionError && (
//         <p className="ap-page__error">
//           {actionError}
//         </p>
//       )}


//       {claims.length === 0 ? (

//         <p className="ap-page__empty">
//           No claims requiring your approval.
//         </p>

//       ) : (

//         <div className="ap-table-wrap">

//           <table className="ap-table">

//             <thead>

//               <tr>
//                 <th>ID</th>
//                 <th>Name</th>
//                 <th>Category</th>
//                 <th>Amount</th>
//                 <th>Date</th>
//                 <th>Status</th>
//                 <th>Decided by</th>
//                 <th>Actions</th>
//               </tr>

//             </thead>


//             <tbody>

//               {claims.map(
//                 (claim) => (

//                   <tr
//                     key={claim.claim_id}
//                   >

//                     <td>
//                       {claim.employee_id}
//                     </td>


//                     <td>
//                       {claim.employee_name ??
//                         "—"}
//                     </td>


//                     <td>
//                       {
//                         categories.find(
//                           (c) =>
//                             c.category_id ===
//                             claim.category_id
//                         )?.name ??
//                         claim.category_id
//                       }
//                     </td>


//                     <td>
//                       ₹
//                       {claim.amount.toLocaleString()}
//                     </td>


//                     <td>
//                       {claim.date}
//                     </td>


//                     <td>

//                       <span
//                         className={
//                           `ap-badge ap-badge--${claim.status.toLowerCase()}`
//                         }
//                       >
//                         {claim.status}
//                       </span>

//                     </td>


//                     <td>

//                       {claim.decided_by_role ? (

//                         <span className="ap-decided-by">

//                           {claim.status ===
//                           "Rejected"
//                             ? "Rejected"
//                             : "Approved"}

//                           {" "}by{" "}

//                           {claim.decided_by_name ??
//                             claim.decided_by_role}


//                           {claim.decided_at && (

//                             <>
//                               <br />

//                               <span className="ap-decided-by__time">

//                                 {formatDecidedAt(
//                                   claim.decided_at
//                                 )}

//                               </span>
//                             </>

//                           )}

//                         </span>

//                       ) : (

//                         <span className="ap-table__done">
//                           —
//                         </span>

//                       )}

//                     </td>


//                     <td className="ap-table__actions">

//                       {claim.status ===
//                         "Submitted" &&
//                         canAct && (

//                           <>

//                             <button
//                               className="ap-btn ap-btn--approve"
//                               onClick={() =>
//                                 handleApprove(
//                                   claim.claim_id
//                                 )
//                               }
//                             >
//                               Approve
//                             </button>


//                             <button
//                               className="ap-btn ap-btn--reject"
//                               onClick={() =>
//                                 handleReject(
//                                   claim.claim_id
//                                 )
//                               }
//                             >
//                               Reject
//                             </button>

//                           </>

//                         )}


//                       {claim.status ===
//                         "Approved" &&
//                         canAct && (

//                           <button
//                             className="ap-btn ap-btn--reimburse"
//                             onClick={() =>
//                               handleReimburse(
//                                 claim.claim_id
//                               )
//                             }
//                           >
//                             Mark reimbursed
//                           </button>

//                         )}


//                       {(claim.status ===
//                         "Rejected" ||
//                         claim.status ===
//                           "Reimbursed" ||
//                         (
//                           (
//                             claim.status ===
//                               "Submitted" ||
//                             claim.status ===
//                               "Approved"
//                           ) &&
//                           !canAct
//                         )) && (

//                           <span className="ap-table__done">
//                             —
//                           </span>

//                         )}

//                     </td>

//                   </tr>

//                 )
//               )}

//             </tbody>

//           </table>

//         </div>

//       )}

//     </div>
//   );
// }


import { useEffect, useState } from "react";

import {
  expenseClaimsApi,
  type ExpenseCategory,
  type ExpenseClaim,
} from "./api";

import { useAuth } from "../../shared/auth/AuthContext";

import "./ApprovalsPage.css";


// ==========================================================
// APPROVER TIERS
// ==========================================================
//
// HR-Restricted is intentionally NOT included.
//
// Expense approval roles:
//   Manager
//   Admin/Leadership
//
// ==========================================================

const APPROVER_TIERS = new Set([
  "Manager",
  "Admin/Leadership",
]);


// ==========================================================
// FORMAT DECIDED AT
// ==========================================================

function formatDecidedAt(
  isoTimestamp: string
): string {

  const d =
    new Date(isoTimestamp);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {
    return "";
  }

  return d.toLocaleString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


// ==========================================================
// DECISION TEXT
// ==========================================================

function getDecisionText(
  claim: ExpenseClaim
): string {

  if (
    claim.status === "Rejected"
  ) {
    return "Rejected by";
  }

  return "Approved by";
}


// ==========================================================
// APPROVAL PAGE
// ==========================================================

export function ApprovalsPage() {

  const { employee } =
    useAuth();


  // ========================================================
  // STATE
  // ========================================================

  const [claims, setClaims] =
    useState<ExpenseClaim[]>([]);

  const [categories, setCategories] =
    useState<ExpenseCategory[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState<string | null>(
      null
    );

  const [actionError, setActionError] =
    useState<string | null>(
      null
    );


  // ========================================================
  // CAN ACT
  // ========================================================

  const canAct =
    employee
      ? APPROVER_TIERS.has(
          employee.access_tier
        )
      : false;


  // ========================================================
  // LOAD APPROVAL CLAIMS
  // ========================================================

  async function loadAll() {

    const [
      claimList,
      categoryList,
    ] = await Promise.all([

      // IMPORTANT:
      //
      // Do NOT pass employee ID.
      //
      // Backend uses the currently logged-in employee
      // and decides which claims are visible.
      //
      expenseClaimsApi.listClaims(),

      expenseClaimsApi.listCategories(),
    ]);


    setClaims(
      claimList
    );

    setCategories(
      categoryList
    );
  }


  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {

    setLoading(true);

    setLoadError(null);

    loadAll()

      .catch((err) => {

        setLoadError(
          err instanceof Error
            ? err.message
            : "Couldn't load claims."
        );

      })

      .finally(() => {

        setLoading(false);

      });

  }, []);


  // ========================================================
  // APPROVE
  // ========================================================

  async function handleApprove(
    claimId: string
  ) {

    setActionError(null);

    try {

      await expenseClaimsApi
        .approveClaim(
          claimId
        );

      // Reload after approval.
      //
      // High-value:
      //
      // Submitted
      //     ↓
      // Manager Approved
      //     ↓
      // Admin sees it
      //
      // Normal:
      //
      // Submitted
      //     ↓
      // Approved

      await loadAll();

    } catch (err) {

      setActionError(
        err instanceof Error
          ? err.message
          : "Couldn't approve this claim."
      );
    }
  }


  // ========================================================
  // REJECT
  // ========================================================

  async function handleReject(
    claimId: string
  ) {

    setActionError(null);

    try {

      await expenseClaimsApi
        .rejectClaim(
          claimId
        );

      await loadAll();

    } catch (err) {

      setActionError(
        err instanceof Error
          ? err.message
          : "Couldn't reject this claim."
      );
    }
  }


  // ========================================================
  // REIMBURSE
  // ========================================================

  async function handleReimburse(
    claimId: string
  ) {

    setActionError(null);

    try {

      await expenseClaimsApi
        .reimburseClaim(
          claimId
        );

      await loadAll();

    } catch (err) {

      setActionError(
        err instanceof Error
          ? err.message
          : "Couldn't mark this claim reimbursed."
      );
    }
  }


  // ========================================================
  // LOADING
  // ========================================================

  if (loading) {

    return (
      <div className="ap-page ap-page--status">
        Loading claims…
      </div>
    );
  }


  // ========================================================
  // LOAD ERROR
  // ========================================================

  if (loadError) {

    return (
      <div className="ap-page ap-page--status ap-page--error">
        Couldn't load this page:{" "}
        {loadError}
      </div>
    );
  }


  // ========================================================
  // PAGE
  // ========================================================

  return (

    <div className="ap-page">

      <h1 className="ap-page__title">
        Approvals
      </h1>


      {/* ====================================================
          APPROVAL RULES
          ==================================================== */}

      <p className="ap-page__subtitle">

        Approval rules:{" "}

        <strong>
          Claims up to ₹25,000 go only to
          the employee's direct reporting manager.
        </strong>{" "}

        Claims above ₹25,000 require
        direct reporting manager approval
        first, followed by Admin/Leadership approval.

        {" "}

        HR-Restricted does not approve
        expense claims.

        {" "}

        The backend enforces these rules
        on every action.

      </p>


      {/* ====================================================
          CURRENT USER
          ==================================================== */}

      <p className="ap-page__acting">

        Signed in as:{" "}

        <strong>
          {employee?.name ??
            employee?.employee_id}
        </strong>{" "}

        ({employee?.access_tier})


        {!canAct && (

          <span className="ap-page__acting-note">

            {" "}
            — this account can view claims
            but cannot act on them.

          </span>
        )}

      </p>


      {/* ====================================================
          ACTION ERROR
          ==================================================== */}

      {actionError && (

        <p className="ap-page__error">
          {actionError}
        </p>

      )}


      {/* ====================================================
          EMPTY STATE
          ==================================================== */}

      {claims.length === 0 ? (

        <p className="ap-page__empty">
          No claims requiring your approval.
        </p>

      ) : (

        <div className="ap-table-wrap">

          <table className="ap-table">

            <thead>

              <tr>

                <th>ID</th>

                <th>Name</th>

                <th>Category</th>

                <th>Amount</th>

                <th>Date</th>

                <th>Status</th>

                <th>Decided By</th>

                <th>Actions</th>

              </tr>

            </thead>


            <tbody>

              {claims.map(
                (claim) => (

                  <tr
                    key={
                      claim.claim_id
                    }
                  >

                    {/* ==================================================
                        ID
                        ================================================== */}

                    <td>
                      {claim.employee_id}
                    </td>


                    {/* ==================================================
                        NAME
                        ================================================== */}

                    <td>
                      {claim.employee_name ??
                        "—"}
                    </td>


                    {/* ==================================================
                        CATEGORY
                        ================================================== */}

                    <td>

                      {
                        categories.find(
                          (c) =>
                            c.category_id ===
                            claim.category_id
                        )?.name ??
                        claim.category_id
                      }

                    </td>


                    {/* ==================================================
                        AMOUNT
                        ================================================== */}

                    <td>

                      ₹
                      {claim.amount.toLocaleString(
                        "en-IN"
                      )}

                    </td>


                    {/* ==================================================
                        DATE
                        ================================================== */}

                    <td>
                      {claim.date}
                    </td>


                    {/* ==================================================
                        STATUS
                        ================================================== */}

                    <td>

                      <span
                        className={
                          `ap-badge ap-badge--${claim.status.toLowerCase()}`
                        }
                      >
                        {claim.status}
                      </span>

                    </td>


                    {/* ==================================================
                        DECIDED BY
                        ================================================== */}

                    <td>

                      {claim.decided_by_role ? (

                        <span className="ap-decided-by">

                          <strong>
                            {getDecisionText(
                              claim
                            )}
                          </strong>{" "}

                          {claim.decided_by_name ??
                            claim.decided_by_role}


                          {claim.decided_at && (

                            <>

                              <br />

                              <span className="ap-decided-by__time">

                                {formatDecidedAt(
                                  claim.decided_at
                                )}

                              </span>

                            </>

                          )}

                        </span>

                      ) : (

                        <span className="ap-table__done">
                          —
                        </span>

                      )}

                    </td>


                    {/* ==================================================
                        ACTIONS
                        ================================================== */}

                    <td className="ap-table__actions">


                      {/* =================================================
                          SUBMITTED
                          =================================================
                          
                          Manager sees Submitted claims.
                          
                          For:
                            <= ₹25,000
                                Manager -> Approved
                          
                            > ₹25,000
                                Manager -> Manager Approved
                          
                          ================================================= */}

                      {claim.status ===
                        "Submitted" &&
                        canAct && (

                          <>

                            <button
                              className="ap-btn ap-btn--approve"
                              onClick={() =>
                                handleApprove(
                                  claim.claim_id
                                )
                              }
                            >
                              Approve
                            </button>


                            <button
                              className="ap-btn ap-btn--reject"
                              onClick={() =>
                                handleReject(
                                  claim.claim_id
                                )
                              }
                            >
                              Reject
                            </button>

                          </>

                        )}


                      {/* =================================================
                          MANAGER APPROVED
                          =================================================
                          
                          Only Admin/Leadership sees this state.
                          
                          Admin can:
                              Approve
                              Reject
                          
                          ================================================= */}

                      {claim.status ===
                        "Manager Approved" &&
                        employee?.access_tier ===
                          "Admin/Leadership" && (

                          <>

                            <button
                              className="ap-btn ap-btn--approve"
                              onClick={() =>
                                handleApprove(
                                  claim.claim_id
                                )
                              }
                            >
                              Final Approve
                            </button>


                            <button
                              className="ap-btn ap-btn--reject"
                              onClick={() =>
                                handleReject(
                                  claim.claim_id
                                )
                              }
                            >
                              Reject
                            </button>

                          </>

                        )}


                      {/* =================================================
                          APPROVED
                          =================================================
                          
                          Only final Approved claims can be reimbursed.
                          
                          ================================================= */}

                      {claim.status ===
                        "Approved" &&
                        employee?.access_tier ===
                          "Admin/Leadership" && (

                          <button
                            className="ap-btn ap-btn--reimburse"
                            onClick={() =>
                              handleReimburse(
                                claim.claim_id
                              )
                            }
                          >
                            Mark reimbursed
                          </button>

                        )}


                      {/* =================================================
                          NO ACTION
                          ================================================= */}

                      {(
                        claim.status ===
                          "Rejected" ||

                        claim.status ===
                          "Reimbursed" ||

                        (
                          (
                            claim.status ===
                              "Submitted" ||

                            claim.status ===
                              "Manager Approved" ||

                            claim.status ===
                              "Approved"
                          ) &&

                          !canAct
                        )

                      ) && (

                        <span className="ap-table__done">
                          —
                        </span>

                      )}

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>

  );
}