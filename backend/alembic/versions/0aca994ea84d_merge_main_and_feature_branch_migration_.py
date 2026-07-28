"""merge main and feature branch migration heads

Revision ID: 0aca994ea84d
Revises: 8fbb45711ade, f10e48e3ff9f
Create Date: 2026-07-28 08:16:46.676391

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0aca994ea84d'
down_revision: Union[str, Sequence[str], None] = ('8fbb45711ade', 'f10e48e3ff9f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
