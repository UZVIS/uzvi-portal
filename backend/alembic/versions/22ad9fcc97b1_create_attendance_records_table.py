"""create attendance_records table

Revision ID: 22ad9fcc97b1
Revises: 1cb0692fd5f3
Create Date: 2026-08-21 19:33:29.368170

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '22ad9fcc97b1'
down_revision: Union[str, Sequence[str], None] = '23632ebbbbc4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Create attendance_records table."""
    op.create_table(
        "attendance_records",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "employee_id",
            sa.String(),
            nullable=False,
        ),
        sa.Column(
            "attendance_date",
            sa.Date(),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum(
                "IN_OFFICE",
                "WFH",
                "ON_LEAVE",
                "ABSENT",
                name="attendancestatus",
            ),
            nullable=False,
        ),
        sa.Column("check_in", sa.Time(), nullable=True),
        sa.Column("check_out", sa.Time(), nullable=True),
        sa.Column("source", sa.String(length=20), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["employee_id"],
            ["employees.employee_id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
 
    op.create_index(
        "ix_attendance_records_id",
        "attendance_records",
        ["id"],
        unique=False,
    )
 
    op.create_index(
        "ix_attendance_records_employee_id",
        "attendance_records",
        ["employee_id"],
        unique=False,
    )
 
    op.create_index(
        "ix_attendance_records_attendance_date",
        "attendance_records",
        ["attendance_date"],
        unique=False,
    )

def downgrade() -> None:
    """Drop attendance_records table."""
    op.drop_index(
        "ix_attendance_records_attendance_date",
        table_name="attendance_records",
    )
    op.drop_index(
        "ix_attendance_records_employee_id",
        table_name="attendance_records",
    )
    op.drop_index(
        "ix_attendance_records_id",
        table_name="attendance_records",
    )
    op.drop_table("attendance_records")