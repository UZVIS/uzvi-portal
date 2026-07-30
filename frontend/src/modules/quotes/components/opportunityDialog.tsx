import { useEffect, useState } from "react";
import { Briefcase, X } from "lucide-react";

interface OpportunityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    client: string;
  }) => void;
}

export default function OpportunityDialog({
  isOpen,
  onClose,
  onSave,
}: OpportunityDialogProps) {
  const [name, setName] = useState("");
  const [client, setClient] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName("");
      setClient("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        {/* Header */}
        <div className="modal-header-row">
          <div className="modal-title-group">
            <div className="modal-icon card-icon-orange">
              <Briefcase size={22} />
            </div>

            <div>
    <h2>New Opportunity</h2>
    <p className="modal-subtitle">
        Create a new client opportunity.
    </p>
</div>
          </div>

          <button
            className="modal-close-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="form-group">
          <label>Opportunity Name</label>

          <input
            type="text"
            placeholder="Enter opportunity name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Client</label>

          <input
            type="text"
            placeholder="Enter client name"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
        </div>

        {/* Footer */}
        <div className="modal-actions">
          <button
            className="secondary-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="add-btn"
            onClick={() =>
              onSave({
                name,
                client,
              })
            }
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}