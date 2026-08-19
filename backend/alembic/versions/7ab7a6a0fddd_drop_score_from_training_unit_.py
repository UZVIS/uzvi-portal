"""drop score from training_unit_completions

Revision ID: 7ab7a6a0fddd
Revises: 7aea7544bf0a
Create Date: 2026-08-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7ab7a6a0fddd'
down_revision: Union[str, Sequence[str], None] = '7aea7544bf0a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    Training is learning-tracking, not assessment, so unit completion no
    longer records a score. Drop the now-unused column.
    """
    op.drop_column('training_unit_completions', 'score')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        'training_unit_completions',
        sa.Column('score', sa.Float(), nullable=True),
    )
