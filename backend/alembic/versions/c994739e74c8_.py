"""empty message

Revision ID: c994739e74c8
Revises: 6a176187feb7, 75b1d17d2be2
Create Date: 2026-07-17 14:21:02.450691

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c994739e74c8'
down_revision: Union[str, Sequence[str], None] = ('6a176187feb7', '75b1d17d2be2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
