import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    output_type: "quote" | "tender";
    target_margin: number;
  }) => void;
}

export default function ScenarioDialog({
  isOpen,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState("");
  const [outputType, setOutputType] =
    useState<"quote" | "tender">("quote");
  const [margin, setMargin] = useState(30);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog">

        <h2>Create Scenario</h2>

        <div className="form-group">
          <label>Scenario Name</label>

          <input
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label>Output Type</label>

          <select
            value={outputType}
            onChange={(e) =>
              setOutputType(
                e.target.value as "quote" | "tender"
              )
            }
          >
            <option value="quote">Quote</option>
            <option value="tender">Tender</option>
          </select>
        </div>

        <div className="form-group">
          <label>Target Margin (%)</label>

          <input
            type="number"
            value={margin}
            onChange={(e) =>
              setMargin(Number(e.target.value))
            }
          />
        </div>

        <div className="dialog-actions">
          <button onClick={onClose}>
            Cancel
          </button>

          <button
            className="primary-btn"
            onClick={() =>
              onSave({
                name,
                output_type: outputType,
                target_margin: margin / 100,
              })
            }
          >
            Create
          </button>
        </div>

      </div>
    </div>
  );
}