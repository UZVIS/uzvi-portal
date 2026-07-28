import { useEffect, useState } from "react";

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

                <h2>New Opportunity</h2>

                <div className="form-group">

                    <label>Opportunity Name</label>

                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                </div>

                <div className="form-group">

                    <label>Client</label>

                    <input
                        value={client}
                        onChange={(e) => setClient(e.target.value)}
                    />

                </div>

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