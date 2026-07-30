// src/modules/attendance/components/AttendanceModal.tsx

import React, { useState, useEffect } from 'react';
import type { AttendanceRecord, AttendanceFormData, AttendanceStatus } from '../types';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AttendanceFormData) => void;
  record?: AttendanceRecord | null;
  loading?: boolean;
  employeeId?: string;
  attendanceDate?: string;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  record,
  loading = false,
  employeeId = '',
  attendanceDate = new Date().toISOString().split('T')[0]
}) => {
  const [status, setStatus] = useState<AttendanceStatus>('in-office');
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');

  useEffect(() => {
    if (record) {
      setStatus(record.status || 'in-office');
      setCheckIn(record.check_in || '');
      setCheckOut(record.check_out || '');
    } else {
      setStatus('in-office');
      setCheckIn('');
      setCheckOut('');
    }
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData: AttendanceFormData = {
      employee_id: record?.employee_id || employeeId,
      attendance_date: record?.attendance_date || attendanceDate,
      status: status,
      check_in: checkIn || undefined,
      check_out: checkOut || undefined,
      source: 'manual'
    };
    
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{record ? 'Edit Attendance' : 'Add Attendance'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                required
              >
                <option value="in-office">🏢 In-Office</option>
                <option value="wfh">🏠 WFH</option>
                <option value="on-leave">🏖️ On-Leave</option>
                <option value="absent">❌ Absent</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="checkIn">Check-in Time</label>
              <input
                id="checkIn"
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkOut">Check-out Time</label>
              <input
                id="checkOut"
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceModal;