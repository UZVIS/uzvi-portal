import { useState } from "react";

interface Props {
  onSubmit: (input: {
    name: string;
    projectType: string;
    billingRate: number;
    costRate: number;
  }) => Promise<void>;
}

const PROJECT_TYPES = [
  "real project",
  "Bench",
  "Training",
  "Internal",
  "BD/Presales",
  "Leave",
];

export function AddProjectForm({ onSubmit }: Props) {
  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [billingRate, setBillingRate] = useState("");
  const [costRate, setCostRate] = useState("");
  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setStatus("error");
      setErrorMsg("Enter a project name.");
      return;
    }

    if (billingRate.trim() === "") {
      setStatus("error");
      setErrorMsg("Enter a billing rate.");
      return;
    }

    if (costRate.trim() === "") {
      setStatus("error");
      setErrorMsg("Enter a cost rate.");
      return;
    }

    const billingRateValue = parseFloat(billingRate);
    const costRateValue = parseFloat(costRate);

    if (!Number.isFinite(billingRateValue) || billingRateValue < 0) {
      setStatus("error");
      setErrorMsg("Enter a valid billing rate.");
      return;
    }

    if (!Number.isFinite(costRateValue) || costRateValue < 0) {
      setStatus("error");
      setErrorMsg("Enter a valid cost rate.");
      return;
    }

    setStatus("saving");
    setErrorMsg("");

    try {
      await onSubmit({
        name: name.trim(),
        projectType,
        billingRate: billingRateValue,
        costRate: costRateValue,
      });

      setName("");
      setBillingRate("");
      setCostRate("");
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Couldn't create this project."
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: 24,
        marginBottom: 24,
        padding: 16,
        border: "1px solid #e6ddd3",
        borderRadius: 8,
        background: "#ffffff",
      }}
    >
      <h3
        style={{
          margin: "0 0 12px 0",
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        Add a project
      </h3>

      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 13,
            color: "#666",
            flex: 1,
          }}
        >
          Name

          <input
            type="text"
            placeholder="e.g. Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              padding: "8px 10px",
              border: "1px solid #d0d0d0",
              borderRadius: 6,
              fontSize: 14,
            }}
          />
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 13,
            color: "#666",
            flex: 1,
          }}
        >
          Type

          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            style={{
              padding: "8px 10px",
              border: "1px solid #d0d0d0",
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 13,
            color: "#666",
            flex: 1,
          }}
        >
          Billing rate

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter billing rate"
            value={billingRate}
            onChange={(e) => setBillingRate(e.target.value)}
            required
            style={{
              padding: "8px 10px",
              border: "1px solid #d0d0d0",
              borderRadius: 6,
              fontSize: 14,
            }}
          />
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 13,
            color: "#666",
            flex: 1,
          }}
        >
          Cost rate

          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter cost rate"
            value={costRate}
            onChange={(e) => setCostRate(e.target.value)}
            required
            style={{
              padding: "8px 10px",
              border: "1px solid #d0d0d0",
              borderRadius: 6,
              fontSize: 14,
            }}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "saving"}
        style={{
          padding: "8px 16px",
          background: "#E2622E",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {status === "saving" ? "Adding…" : "Add project"}
      </button>

      {status === "error" && (
        <p
          style={{
            marginTop: 8,
            color: "#c0392b",
            fontSize: 13,
          }}
        >
          {errorMsg}
        </p>
      )}

      {status === "saved" && (
        <p
          style={{
            marginTop: 8,
            color: "#2e7d32",
            fontSize: 13,
          }}
        >
          Added.
        </p>
      )}
    </form>
  );
}