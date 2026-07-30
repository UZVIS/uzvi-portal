"""make document access log timestamp timezone-aware

Revision ID: cf227a12d0d2
Revises: 6a176187feb7
Create Date: 2026-07-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cf227a12d0d2'
down_revision: Union[str, Sequence[str], None] = '6a176187feb7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('document_access_logs') as batch_op:
        batch_op.alter_column(
            'timestamp',
            existing_type=sa.DATETIME(),
            type_=sa.DateTime(timezone=True),
            existing_nullable=False,
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('document_access_logs') as batch_op:
        batch_op.alter_column(
            'timestamp',
            existing_type=sa.DateTime(timezone=True),
            type_=sa.DATETIME(),
            existing_nullable=False,
        )