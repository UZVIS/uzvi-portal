"""merge calendar and consultant-utilization notes branches

Revision ID: f4a8c2e1b9d7
Revises: 3dea157d44ad, b2c3d4e5f6a7
Create Date: 2026-07-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4a8c2e1b9d7'
down_revision: Union[str, Sequence[str], None] = ('3dea157d44ad', 'b2c3d4e5f6a7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass