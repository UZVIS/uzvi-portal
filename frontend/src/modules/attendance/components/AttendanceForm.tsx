import React, { useState } from 'react';

interface AttendanceFormProps {
  onSave: (data: any) => void;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ onSave }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date(),
    status: 'present', // present | absent | leave
    checkIn: '',
    checkOut: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="attendance-form">
      <h2>Attendance Form</h2>
      <form onSubmit={handleSubmit}>
        {/* Employee selection */}
        <div className="form-group">
          <label>Employee</label>
          <select value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})}>
            <option value="">Select Employee</option>
          </select>
        </div>
        
        {/* Date picker */}
        <div className="form-group">
          <label>Date</label>
          <input type="date" />
        </div>
        
        {/* Status selection */}
        <div className="form-group">
          <label>Status</label>
          <select>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="leave">Leave</option>
          </select>
        </div>
        
        {/* Check-in time */}
        <div className="form-group">
          <label>Check In</label>
          <input type="time" />
        </div>
        
        {/* Check-out time */}
        <div className="form-group">
          <label>Check Out</label>
          <input type="time" />
        </div>
        
        {/* Notes */}
        <div className="form-group">
          <label>Notes</label>
          <textarea rows={3} />
        </div>
        
        <button type="submit">Save Attendance</button>
      </form>
    </div>
  );
};

export default AttendanceForm;