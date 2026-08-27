import { useEffect, useState } from "react";
import type { ExpenseCategory } from "../api";
import "./ExpenseClaimForm.css";

interface ProjectOption {
  project_id: string;
  name: string;
}

interface Props {
  categories: ExpenseCategory[];
  projects: ProjectOption[];
  onSubmit: (input: {
    categoryId: string;
    amount: number;
    date: string;
    description: string;
    receiptFile: File | null;
    projectId: string | null;
  }) => Promise<void>;
}

export function ExpenseClaimForm({
  categories,
  projects,
  onSubmit,
}: Props) {
  const [categoryId, setCategoryId] = useState(
    categories[0]?.category_id ?? ""
  );

  /*
   * Project is OPTIONAL.
   *
   * Empty string means no project selected.
   */
  const [projectId, setProjectId] = useState("");

  const [amount, setAmount] = useState("");

  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [description, setDescription] =
    useState("");

  const [receiptFile, setReceiptFile] =
    useState<File | null>(null);

  const [fileInputKey, setFileInputKey] =
    useState(0);

  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const [errorMsg, setErrorMsg] =
    useState("");


  /* =========================================================
     SELECTED CATEGORY
  ========================================================= */

  const selectedCategory =
    categories.find(
      (c) =>
        c.category_id === categoryId
    );


  /* =========================================================
     CATEGORY DEFAULT
  ========================================================= */

  useEffect(() => {
    if (
      !categoryId &&
      categories.length > 0
    ) {
      setCategoryId(
        categories[0].category_id
      );
    }
  }, [
    categories,
    categoryId,
  ]);


  /* =========================================================
     SUBMIT
  ========================================================= */

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();


    /* -------------------------------------------------------
       VALIDATE AMOUNT / CATEGORY
    ------------------------------------------------------- */

    const parsedAmount =
      parseFloat(amount);


    if (
      !categoryId ||
      !parsedAmount ||
      parsedAmount <= 0
    ) {
      setStatus("error");

      setErrorMsg(
        "Pick a category and enter an amount greater than 0."
      );

      return;
    }


    /* -------------------------------------------------------
       RECEIPT VALIDATION

       Receipt is still REQUIRED according to
       the existing form requirement.
    ------------------------------------------------------- */

    if (!receiptFile) {
      setStatus("error");

      setErrorMsg(
        "Please attach a receipt before submitting."
      );

      return;
    }


    /*
     * IMPORTANT:
     *
     * Project is OPTIONAL.
     *
     * There is intentionally NO validation such as:
     *
     * if (!projectId) {
     *   ...
     * }
     */


    /* -------------------------------------------------------
       START SAVING
    ------------------------------------------------------- */

    setStatus("saving");

    setErrorMsg("");


    try {

      await onSubmit({

        categoryId,

        amount:
          parsedAmount,

        date,

        description,

        receiptFile,

        /*
         * If a project was selected:
         *
         *   "PROJECT001"
         *
         * If no project was selected:
         *
         *   null
         */
        projectId:
          projectId || null,
      });


      /* -----------------------------------------------------
         RESET FORM
      ----------------------------------------------------- */

      setAmount("");

      setDescription("");

      setReceiptFile(null);

      setFileInputKey(
        (k) => k + 1
      );

      /*
       * Reset project selection to
       * "No project".
       */
      setProjectId("");


      setStatus("saved");


      /* -----------------------------------------------------
         HIDE SUCCESS MESSAGE
         AFTER 2 SECONDS
      ----------------------------------------------------- */

      window.setTimeout(() => {
        setStatus("idle");
      }, 2000);

    } catch (err) {

      setStatus("error");

      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Couldn't submit this claim."
      );

    }
  }


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <form
      className="claim-form"
      onSubmit={handleSubmit}
    >

      {/* =====================================================
          TITLE
      ===================================================== */}

      <h3 className="claim-form__title">
        Submit an expense claim
      </h3>


      {/* =====================================================
          CATEGORY / AMOUNT / DATE
      ===================================================== */}

      <div className="claim-form__row">


        {/* ---------------------------------------------------
            CATEGORY
        --------------------------------------------------- */}

        <label>

          Category

          <select
            value={categoryId}
            onChange={(e) =>
              setCategoryId(
                e.target.value
              )
            }
          >

            {categories.map(
              (c) => (

                <option
                  key={c.category_id}
                  value={c.category_id}
                >
                  {c.name}
                </option>

              )
            )}

          </select>

        </label>


        {/* ---------------------------------------------------
            AMOUNT
        --------------------------------------------------- */}

        <label>

          Amount

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) =>
              setAmount(
                e.target.value
              )
            }
            onWheel={(e) =>
              e.currentTarget.blur()
            }
          />

        </label>


        {/* ---------------------------------------------------
            DATE
        --------------------------------------------------- */}

        <label>

          Date

          <input
            type="date"
            value={date}
            max={
              new Date()
                .toISOString()
                .slice(0, 10)
            }
            onChange={(e) =>
              setDate(
                e.target.value
              )
            }
          />

        </label>

      </div>


      {/* =====================================================
          PROJECT
          OPTIONAL
      ===================================================== */}

      <label className="claim-form__field">

        Project{" "}

        <span
          style={{
            color: "#6b7280",
            fontWeight: 400,
            fontSize: "0.9em",
          }}
        >
          (optional)
        </span>


        <select
          value={projectId}
          onChange={(e) =>
            setProjectId(
              e.target.value
            )
          }
        >

          {/* -------------------------------------------------
              IMPORTANT:

              This option is NOT disabled.

              The employee can leave the project
              unselected and submit the claim.
          ------------------------------------------------- */}

          <option value="">
            Select Project 
          </option>


          {projects.map(
            (p) => (

              <option
                key={p.project_id}
                value={p.project_id}
              >
                {p.name}
              </option>

            )
          )}

        </select>

      </label>


      {/* =====================================================
          DESCRIPTION
      ===================================================== */}

      <label className="claim-form__field">

        Description

        <textarea
          rows={2}
          placeholder="What was this for?"
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
        />

      </label>


      {/* =====================================================
          RECEIPT
      ===================================================== */}

      <label className="claim-form__field">

        Receipt (required)

        <input
          key={fileInputKey}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          required
          onChange={(e) =>
            setReceiptFile(
              e.target.files?.[0] ??
                null
            )
          }
        />

      </label>


      {/* =====================================================
          SELECTED RECEIPT
      ===================================================== */}

      {receiptFile && (

        <p className="claim-form__hint">

          Selected:{" "}
          {receiptFile.name}

        </p>

      )}


      {/* =====================================================
          CATEGORY CAP
      ===================================================== */}

      {selectedCategory?.cap_amount !=
        null && (

        <p className="claim-form__hint">

          Cap for this category: ₹
          {selectedCategory.cap_amount.toLocaleString()}

        </p>

      )}


      {/* =====================================================
          SUBMIT BUTTON
      ===================================================== */}

      <button
        type="submit"
        disabled={
          status === "saving"
        }
      >

        {status === "saving"
          ? "Submitting…"
          : "Submit claim"}

      </button>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {status === "error" && (

        <p className="claim-form__error">
          {errorMsg}
        </p>

      )}


      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {status === "saved" && (

        <p className="claim-form__success">
          Submitted.
        </p>

      )}

    </form>

  );
}