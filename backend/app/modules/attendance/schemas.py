"""
Attendance Tracker Schemas
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import date, time, datetime
from typing import Optional
from enum import Enum


class AttendanceStatus(str, Enum):
    """Attendance status enum - ఖచ్చితమైన వాల్యూస్ మాత్రమే"""
    IN_OFFICE = "in-office"
    WFH = "wfh"
    ON_LEAVE = "on-leave"
    ABSENT = "absent"


# ========== Base Schema ==========
class AttendanceBase(BaseModel):
    """Base attendance schema with all required fields"""
    employee_id: str = Field(..., description="Employee ID from M0 Directory")
    attendance_date: date = Field(..., description="Date of attendance")
    status: AttendanceStatus = Field(..., description="Attendance status (in-office/wfh/on-leave/absent)")
    check_in: Optional[time] = Field(None, description="Check-in time (HH:MM:SS)")
    check_out: Optional[time] = Field(None, description="Check-out time (HH:MM:SS)")
    source: Optional[str] = Field("manual", description="Source of entry: manual or import")


# ========== Create Schema ==========
class AttendanceCreate(AttendanceBase):
    """Schema for creating a new attendance record"""
    pass


# ========== Update Schema ==========
class AttendanceUpdate(BaseModel):
    """Schema for updating an existing attendance record"""
    status: Optional[AttendanceStatus] = None
    check_in: Optional[time] = None
    check_out: Optional[time] = None
    source: Optional[str] = None


# ========== Response Schema ==========
class AttendanceResponse(AttendanceBase):
    """Schema for API response - includes auto-generated fields"""
    attendance_id: int = Field(..., description="Auto-generated unique ID")
    created_at: datetime = Field(..., description="Record creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    # Pydantic V2 configuration for ORM compatibility
    model_config = ConfigDict(from_attributes=True)


# ========== Bulk Create Schema ==========
class AttendanceBulkCreate(BaseModel):
    """Schema for bulk attendance creation"""
    records: list[AttendanceCreate]


# ========== Filter Schema ==========
class AttendanceFilter(BaseModel):
    """Schema for filtering attendance records"""
    employee_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[AttendanceStatus] = None
    source: Optional[str] = None


# ========== Export Schema ==========
class AttendanceExportRequest(BaseModel):
    """Schema for export request"""
    employee_id: str
    year: int = Field(..., ge=2000, le=2100)
    month: int = Field(..., ge=1, le=12)
    format: str = Field("csv", description="Export format: csv or excel")