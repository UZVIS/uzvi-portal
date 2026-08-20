"""add aadhar number to candidate

Revision ID: d47754506bf3
Revises: 23632ebbbbc4
Create Date: 2026-08-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd47754506bf3'
down_revision: Union[str, Sequence[str], None] = '23632ebbbbc4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('candidates', sa.Column('aadhar_number', sa.String(), nullable=True))
    op.create_index(op.f('ix_candidates_aadhar_number'), 'candidates', ['aadhar_number'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_candidates_aadhar_number'), table_name='candidates')
    op.drop_column('candidates', 'aadhar_number')