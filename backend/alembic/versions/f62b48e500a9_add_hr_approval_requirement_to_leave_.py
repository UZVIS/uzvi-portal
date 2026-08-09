"""add hr approval requirement to leave types

Revision ID: f62b48e500a9
Revises: f4a8c2e1b9d7
Create Date: 2026-08-09 14:37:57.136737

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f62b48e500a9'
down_revision: Union[str, Sequence[str], None] = 'f4a8c2e1b9d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "leave_types",
        sa.Column(
            "requires_hr_approval",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("leave_types", "requires_hr_approval")