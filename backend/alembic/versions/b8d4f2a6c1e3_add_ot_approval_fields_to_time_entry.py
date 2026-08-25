
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b8d4f2a6c1e3'
down_revision: Union[str, Sequence[str], None] = 'a7c3e9f1d2b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('time_entry', sa.Column('ot_status', sa.String(), nullable=True))
    op.add_column('time_entry', sa.Column('ot_decided_by_role', sa.String(), nullable=True))
    op.add_column('time_entry', sa.Column('ot_decided_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('time_entry', 'ot_decided_at')
    op.drop_column('time_entry', 'ot_decided_by_role')
    op.drop_column('time_entry', 'ot_status')