"""merge heads

Revision ID: 9a9ddd5dd87a
Revises: 2b69782b7c4c, 7aea7544bf0a
Create Date: 2026-07-15 17:48:27.242369

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a9ddd5dd87a'
down_revision: Union[str, Sequence[str], None] = ('2b69782b7c4c', '7aea7544bf0a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
