"""merge heads: training unit + candidate aadhar

Revision ID: ba2a7e7cd030
Revises: 7ab7a6a0fddd, d47754506bf3
Create Date: 2026-08-19 20:54:49.358923

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ba2a7e7cd030'
down_revision: Union[str, Sequence[str], None] = ('7ab7a6a0fddd', 'd47754506bf3')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
