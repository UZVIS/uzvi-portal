from typing import Sequence, Union
 
from alembic import op
import sqlalchemy as sa
 
 
revision: str = 'a7c3e9f1d2b4'
down_revision: Union[str, Sequence[str], None] = 'f4a8c2e1b9d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None
 
 
def upgrade() -> None:
    op.add_column('time_entry', sa.Column('normal_hours', sa.Float(), nullable=False, server_default='0'))
    op.add_column('time_entry', sa.Column('overtime_hours', sa.Float(), nullable=False, server_default='0'))
    op.execute("UPDATE time_entry SET normal_hours = hours, overtime_hours = 0")
 
 
def downgrade() -> None:
    op.drop_column('time_entry', 'overtime_hours')
    op.drop_column('time_entry', 'normal_hours')