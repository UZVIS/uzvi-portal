import type {
  ExpenseClaim,
  ExpenseCategory,
} from "../api";

import "./ClaimsTable.css";


interface Props {
  claims: ExpenseClaim[];
  categories: ExpenseCategory[];
}


function formatDecidedAt(
  value: string | null | undefined
): string | null {

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString(
    "en-IN",
    {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }
  );
}


export function ClaimsTable({
  claims,
  categories,
}: Props) {

  if (claims.length === 0) {

    return (
      <p className="claims-table__empty">
        No claims submitted yet.
      </p>
    );

  }


  const sorted = [...claims].sort(
    (a, b) =>
      a.date < b.date ? 1 : -1
  );


  return (

    <table className="claims-table">

      <thead>

        <tr>

          <th>Date</th>

          <th>Category</th>

          <th>Amount</th>

          <th>Description</th>

          <th>Status</th>

          <th>Decided By</th>

          <th>Receipt</th>

        </tr>

      </thead>


      <tbody>

        {sorted.map((claim) => {

          const filename =
            claim.receipt_file_path
              ? claim.receipt_file_path
                  .split("/")
                  .pop()
              : null;


          const receiptUrl =
            filename
              ? "/receipts/" + filename
              : null;


          const decidedAt =
            formatDecidedAt(
              claim.decided_at
            );


          const approverName =
            claim.decided_by_name ||
            claim.decided_by ||
            null;


          const isRejected =
            claim.status === "Rejected";


          const isApproved =
            claim.status === "Approved" ||
            claim.status === "Reimbursed";


          return (

            <tr
              key={claim.claim_id}
            >

              {/* DATE */}

              <td>
                {claim.date}
              </td>


              {/* CATEGORY */}

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


              {/* AMOUNT */}

              <td>
                ₹
                {claim.amount.toLocaleString()}
              </td>


              {/* DESCRIPTION */}

              <td
                className="claims-table__description"
                title={
                  claim.description ??
                  undefined
                }
              >

                {claim.description ? (

                  claim.description

                ) : (

                  <span className="claims-table__receipt-none">
                    —
                  </span>

                )}

              </td>


              {/* STATUS */}

              <td>

                <span
                  className={
                    "claims-table__badge claims-table__badge--" +
                    claim.status.toLowerCase()
                  }
                >

                  {claim.status}

                </span>

              </td>


              {/* DECIDED BY */}

              <td className="claims-table__decided-by">

                {approverName ? (

                  <div>

                    <div
                      className="claims-table__decided-name"
                    >

                      <strong>
                        {isRejected
                          ? "Rejected by"
                          : isApproved
                          ? "Approved by"
                          : "Decided by"}
                      </strong>{" "}

                      {approverName}

                    </div>


                    {decidedAt && (

                      <div
                        className="claims-table__decided-at"
                      >
                        {decidedAt}
                      </div>

                    )}

                  </div>

                ) : (

                  <span className="claims-table__receipt-none">
                    —
                  </span>

                )}

              </td>


              {/* RECEIPT */}

              <td>

                {receiptUrl ? (

                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="claims-table__receipt-link"
                  >
                    View
                  </a>

                ) : (

                  <span className="claims-table__receipt-none">
                    —
                  </span>

                )}

              </td>

            </tr>

          );

        })}

      </tbody>

    </table>

  );

}