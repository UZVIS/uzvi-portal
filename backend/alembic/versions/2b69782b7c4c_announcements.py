"""announcements

Revision ID: 2b69782b7c4c
Revises: 4bb1f85e63cb
Create Date: 2026-07-14 11:21:31.242693

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '2b69782b7c4c'
down_revision: Union[str, Sequence[str], None] = '4bb1f85e63cb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'announcements',
        sa.Column('announcement_id', sa.String(), nullable=False),
        sa.Column('posted_by', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('target_type', sa.String(), nullable=False),
        sa.Column('target_value', sa.String(), nullable=True),
        sa.Column('requires_ack', sa.Boolean(), nullable=False),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('posted_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['posted_by'], ['employees.employee_id']),
        sa.PrimaryKeyConstraint('announcement_id')
    )
    op.create_index(op.f('ix_announcements_announcement_id'), 'announcements', ['announcement_id'], unique=False)

    op.create_table(
        'announcement_acks',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('announcement_id', sa.String(), nullable=False),
        sa.Column('employee_id', sa.String(), nullable=False),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['announcement_id'], ['announcements.announcement_id']),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.employee_id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_announcement_acks_id'), 'announcement_acks', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_announcement_acks_id'), table_name='announcement_acks')
    op.drop_table('announcement_acks')
    op.drop_index(op.f('ix_announcements_announcement_id'), table_name='announcements')
    op.drop_table('announcements')