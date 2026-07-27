import { useState } from "react";
import "./CreateTicketPage.css";

import { helpdeskApi } from "./api";
import type { TicketCreate } from "./types";

interface CreateTicketPageProps {
  onTicketCreated: () => void;
  onCancel: () => void;
}

const categories = [
  "Hardware",
  "Software",
  "Network",
  "Access",
  "Email",
  "Other",
];

const priorities = [
  "Low",
  "Medium",
  "High",
];

export default function CreateTicketPage({
  onTicketCreated,
  onCancel,
}: CreateTicketPageProps) {
  const [form, setForm] = useState<TicketCreate>({
    raised_by: "",
    category: "",
    priority: "Medium",
    description: "",
    assigned_to: "",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");

    if (!form.raised_by.trim()) {
      setError("Raised By is required.");
      return;
    }

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    if (!form.priority) {
      setError("Please select a priority.");
      return;
    }

    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    try {
      setLoading(true);

      await helpdeskApi.createTicket({
        ...form,
        assigned_to:
          form.assigned_to?.trim() || null,
      });

      alert("Ticket created successfully!");

      setForm({
        raised_by: "",
        category: "",
        priority: "Medium",
        description: "",
        assigned_to: "",
      });

      onTicketCreated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create ticket."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-ticket-page">
      <div className="create-ticket-card">
        <div className="create-ticket-header">
          <h2>Create New Ticket</h2>

          <p>
            Fill in the details below to
            submit a new helpdesk request.
          </p>
        </div>

        <form
          className="ticket-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="form-grid">

            <div className="form-group">
              <label>
                Raised By
              </label>

              <input
                type="text"
                name="raised_by"
                value={form.raised_by}
                onChange={handleChange}
                placeholder="Employee name or ID"
              />
            </div>

            <div className="form-group">
              <label>
                Assigned To
              </label>

              <input
                type="text"
                name="assigned_to"
                value={form.assigned_to ?? ""}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>

            <div className="form-group">
              <label>
                Category
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="">
                  Select category
                </option>

                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                Priority
              </label>

              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                {priorities.map((priority) => (
                  <option
                    key={priority}
                    value={priority}
                  >
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>
                Description
              </label>

              <textarea
                rows={6}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your issue..."
              />
            </div>
            </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading
                ? "Creating..."
                : "Create Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}