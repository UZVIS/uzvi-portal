"""add purchase_date to asset

Revision ID: 4bb1f85e63cb
Revises: 60d5c1c8f1e8
Create Date: 2026-07-09 20:37:34.570200

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4bb1f85e63cb'
down_revision: Union[str, Sequence[str], None] = '60d5c1c8f1e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'assets',
        sa.Column('asset_id', sa.String(), nullable=False),
        sa.Column('tag', sa.String(), nullable=False),
        sa.Column('asset_type', sa.String(), nullable=False),
        sa.Column('purchase_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('asset_id'),
    )
    op.create_index(op.f('ix_assets_asset_id'), 'assets', ['asset_id'], unique=False)
    op.create_index(op.f('ix_assets_tag'), 'assets', ['tag'], unique=True)

    op.create_table(
        'asset_assignments',
        sa.Column('assignment_id', sa.String(), nullable=False),
        sa.Column('asset_id', sa.String(), nullable=False),
        sa.Column('employee_id', sa.String(), nullable=False),
        sa.Column('assigned_date', sa.Date(), nullable=False),
        sa.Column('returned_date', sa.Date(), nullable=True),
        sa.Column('remarks', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['asset_id'], ['assets.asset_id']),
        sa.PrimaryKeyConstraint('assignment_id'),
    )
    op.create_index(
        op.f('ix_asset_assignments_assignment_id'),
        'asset_assignments',
        ['assignment_id'],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f('ix_asset_assignments_assignment_id'), table_name='asset_assignments'
    )
    op.drop_table('asset_assignments')

    op.drop_index(op.f('ix_assets_tag'), table_name='assets')
    op.drop_index(op.f('ix_assets_asset_id'), table_name='assets')
    op.drop_table('assets')
