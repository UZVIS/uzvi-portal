"""create missing utilization and expense_claims tables

Revision ID: ef9ec51fd0dc
Revises: c994739e74c8
Create Date: 2026-07-28

NOTE: these tables (project, time_entry, expense_category, expense_claim)
were never created by any earlier migration in Consultant Utilization or
Expense Claims - only altered. This migration adds them so the existing
chain (specifically 8fbb45711ade) has something to ALTER. Flagged for
Saideep's review since these are his modules.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'ef9ec51fd0dc'
down_revision: Union[str, Sequence[str], None] = 'c994739e74c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'project',
        sa.Column('project_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('project_type', sa.String(), nullable=False),
        sa.Column('billing_rate', sa.Float(), nullable=True),
        sa.Column('cost_rate', sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint('project_id'),
    )
    op.create_table(
        'time_entry',
        sa.Column('entry_id', sa.String(), nullable=False),
        sa.Column('employee_id', sa.String(), nullable=False),
        sa.Column('project_id', sa.String(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('hours', sa.Float(), nullable=False),
        sa.Column('billable_flag', sa.Boolean(), nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.employee_id']),
        sa.ForeignKeyConstraint(['project_id'], ['project.project_id']),
        sa.PrimaryKeyConstraint('entry_id'),
    )
    op.create_table(
        'expense_category',
        sa.Column('category_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('cap_amount', sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint('category_id'),
    )
    op.create_table(
        'expense_claim',
        sa.Column('claim_id', sa.String(), nullable=False),
        sa.Column('employee_id', sa.String(), nullable=False),
        sa.Column('category_id', sa.String(), nullable=False),
        sa.Column('project_id', sa.String(), nullable=True),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['employee_id'], ['employees.employee_id']),
        sa.ForeignKeyConstraint(['category_id'], ['expense_category.category_id']),
        sa.ForeignKeyConstraint(['project_id'], ['project.project_id']),
        sa.PrimaryKeyConstraint('claim_id'),
    )


def downgrade() -> None:
    op.drop_table('expense_claim')
    op.drop_table('expense_category')
    op.drop_table('time_entry')
    op.drop_table('project')