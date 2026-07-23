"""add description and receipt_file_path to expense_claim

Revision ID: 8fbb45711ade
Revises: c994739e74c8
Create Date: 2026-07-23 16:00:39.760264

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8fbb45711ade'
down_revision: Union[str, Sequence[str], None] = 'c994739e74c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('expense_claim', sa.Column('receipt_file_path', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('expense_claim', 'receipt_file_path')