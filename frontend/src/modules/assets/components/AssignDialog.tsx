import { useState, useEffect } from "react";
import { UserPlus, X } from "lucide-react";

import { getEmployees } from "../services/employeeService";
import type { Employee } from "../types/employee";

import "../styles/form.css";

interface AssignDialogProps {
    isOpen: boolean;
    assetId: string;
    onClose: () => void;
    onAssign: (data: {
        employeeId: string;
        assignedDate: string;
        remarks: string;
    }) => void;
}

export default function AssignDialog({
    isOpen,
    assetId,
    onClose,
    onAssign,
}: AssignDialogProps) {

    const [employeeId, setEmployeeId] = useState("");

    const [assignedDate, setAssignedDate] = useState("");

    const [remarks, setRemarks] = useState("");

    const [employees, setEmployees] = useState<Employee[]>([]);

    useEffect(() => {

        if (!isOpen) return;

        setEmployeeId("");

        setAssignedDate(
            new Date().toISOString().split("T")[0]
        );

        setRemarks("");

        loadEmployees();

    }, [isOpen]);

    async function loadEmployees() {

        try {

            const data = await getEmployees();

            setEmployees(data);

        } catch (error) {

            console.error("Failed to load employees:", error);

        }

    }

    function handleAssign() {

        if (!employeeId) {

            alert("Please select an employee.");

            return;

        }

        onAssign({
            employeeId,
            assignedDate,
            remarks,
        });

    }

    if (!isOpen) return null;

    return (

        <div className="asset-form-overlay">

            <div className="asset-form-modal">

                {/* Header */}

                <div className="asset-form-header">

                    <div className="asset-form-header-left">

                        <div className="asset-form-icon">

                            <UserPlus size={20} />

                        </div>

                        <div>

                            <h2 className="asset-form-title">
                                Assign Asset
                            </h2>

                            <p className="asset-form-subtitle">
                                Assign this asset to an employee
                            </p>

                        </div>

                    </div>

                    <button
                        className="asset-form-close"
                        onClick={onClose}
                    >

                        <X size={20} />

                    </button>

                </div>

                {/* Body */}

                <div className="asset-form-body">

                    <div className="asset-form-grid">

                        {/* Asset ID */}

                        <div className="asset-form-field full-span">

                            <label className="asset-form-label">
                                Asset ID
                            </label>

                            <input
                                className="asset-form-input"
                                value={assetId}
                                disabled
                            />

                        </div>

                        {/* Employee */}

                        <div className="asset-form-field full-span">

                            <label className="asset-form-label">
                                Employee
                                <span className="required">*</span>
                            </label>

                            <select
                                className="asset-form-select"
                                value={employeeId}
                                onChange={(e) =>
                                    setEmployeeId(e.target.value)
                                }
                            >

                                <option value="">
                                    Select Employee
                                </option>

                                {employees
                                    .filter(
                                        employee =>
                                            employee.employment_status.toLowerCase() === "active"

                                    )
                                    .map(employee => (

                                        <option
                                            key={employee.employee_id}
                                            value={employee.employee_id}
                                        >

                                            {employee.employee_id} - {employee.name}

                                        </option>

                                    ))}

                            </select>

                        </div>

                        {/* Assigned Date */}

                        <div className="asset-form-field">

                            <label className="asset-form-label">
                                Assigned Date
                            </label>

                            <input
                                type="date"
                                className="asset-form-input"
                                value={assignedDate}
                                onChange={(e) =>
                                    setAssignedDate(e.target.value)
                                }
                            />

                        </div>

                        {/* Remarks */}

                        <div className="asset-form-field full-span">

                            <label className="asset-form-label">
                                Remarks
                            </label>

                            <textarea
                                rows={3}
                                className="asset-form-textarea"
                                placeholder="Optional remarks..."
                                value={remarks}
                                onChange={(e) =>
                                    setRemarks(e.target.value)
                                }
                            />

                        </div>

                    </div>

                </div>

                {/* Footer */}

                <div className="asset-form-footer">

                    <button
                        className="asset-form-cancel-btn"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        className="asset-form-save-btn"
                        onClick={handleAssign}
                    >
                        Assign Asset
                    </button>

                </div>

            </div>

        </div>

    );

}