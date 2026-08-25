"""merge overtime and leave approval heads

Revision ID: 23632ebbbbc4
Revises: b8d4f2a6c1e3, f62b48e500a9
Create Date: 2026-08-10 17:11:33.303430

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '23632ebbbbc4'
down_revision: Union[str, Sequence[str], None] = ('b8d4f2a6c1e3', 'f62b48e500a9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
