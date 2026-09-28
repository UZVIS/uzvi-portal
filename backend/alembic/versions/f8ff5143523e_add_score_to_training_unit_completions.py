"""add_score_to_training_unit_completions

Revision ID: f8ff5143523e
Revises: 1cb0692fd5f3
Create Date: 2026-09-11 11:20:10.899077

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8ff5143523e'
down_revision: Union[str, Sequence[str], None] = '1cb0692fd5f3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "training_unit_completions",
        sa.Column("score", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("training_unit_completions", "score")
