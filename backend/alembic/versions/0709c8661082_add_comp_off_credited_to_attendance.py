"""add comp off credited to attendance
 
Revision ID: 0709c8661082
Revises: 23632ebbbbc4
Create Date: 2026-08-20 11:45:35.939273
"""
 
from typing import Sequence, Union
 
from alembic import op
import sqlalchemy as sa
 
 
# revision identifiers, used by Alembic.
revision: str = "0709c8661082"
down_revision: Union[str, Sequence[str], None] = "23632ebbbbc4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None
 
 
def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "attendance_records",
        sa.Column(
            "is_comp_off_credited",
            sa.Boolean(),
            nullable=True
        )
    )
 
 
def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column(
        "attendance_records",
        "is_comp_off_credited"
    )