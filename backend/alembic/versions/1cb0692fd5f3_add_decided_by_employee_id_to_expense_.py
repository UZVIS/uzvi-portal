"""add decided_by employee_id to expense_claim

Revision ID: 1cb0692fd5f3
Revises: a815746f0616
Create Date: 2026-08-21 16:25:39.468769

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1cb0692fd5f3'
down_revision: Union[str, Sequence[str], None] = 'a815746f0616'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('expense_claim', schema=None) as batch_op:
        batch_op.add_column(sa.Column('decided_by', sa.String(), nullable=True))
        batch_op.create_foreign_key(
            'fk_expense_claim_decided_by_employees',
            'employees',
            ['decided_by'],
            ['employee_id'],
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('expense_claim', schema=None) as batch_op:
        batch_op.drop_constraint('fk_expense_claim_decided_by_employees', type_='foreignkey')
        batch_op.drop_column('decided_by')