
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '0aca994ea84d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('expense_claim', sa.Column('decided_by_role', sa.String(), nullable=True))
    op.add_column('expense_claim', sa.Column('decided_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('expense_claim', 'decided_at')
    op.drop_column('expense_claim', 'decided_by_role')