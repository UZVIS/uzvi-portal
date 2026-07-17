"""add recruiting module tables

Revision ID: 6a176187feb7
Revises: 9a9ddd5dd87a
Create Date: 2026-07-15 17:55:55.567588

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '6a176187feb7'
down_revision: Union[str, Sequence[str], None] = '9a9ddd5dd87a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('candidates',
    sa.Column('candidate_id', sa.VARCHAR(), nullable=False),
    sa.Column('name', sa.VARCHAR(), nullable=False),
    sa.Column('resume_details', sa.TEXT(), nullable=True),
    sa.Column('applied_role', sa.VARCHAR(), nullable=False),
    sa.Column('source', sa.VARCHAR(), nullable=True),
    sa.Column('stage', sa.VARCHAR(), nullable=False),
    sa.Column('converted_emp_id', sa.VARCHAR(), nullable=True),
    sa.Column('created_at', sa.DATETIME(), nullable=False),
    sa.ForeignKeyConstraint(['converted_emp_id'], ['employees.employee_id'], ),
    sa.PrimaryKeyConstraint('candidate_id')
    )
    op.create_index(op.f('ix_candidates_candidate_id'), 'candidates', ['candidate_id'], unique=False)
    op.create_table('interview_stages',
    sa.Column('stage_id', sa.VARCHAR(), nullable=False),
    sa.Column('candidate_id', sa.VARCHAR(), nullable=False),
    sa.Column('stage_name', sa.VARCHAR(), nullable=False),
    sa.Column('interviewer_id', sa.VARCHAR(), nullable=True),
    sa.Column('notes', sa.TEXT(), nullable=True),
    sa.Column('timestamp', sa.DATETIME(), nullable=False),
    sa.ForeignKeyConstraint(['candidate_id'], ['candidates.candidate_id'], ),
    sa.ForeignKeyConstraint(['interviewer_id'], ['employees.employee_id'], ),
    sa.PrimaryKeyConstraint('stage_id')
    )
    op.create_index(op.f('ix_interview_stages_stage_id'), 'interview_stages', ['stage_id'], unique=False)
    op.create_table('scorecards',
    sa.Column('scorecard_id', sa.VARCHAR(), nullable=False),
    sa.Column('stage_id', sa.VARCHAR(), nullable=False),
    sa.Column('questions', sa.TEXT(), nullable=True),
    sa.Column('score', sa.FLOAT(), nullable=True),
    sa.ForeignKeyConstraint(['stage_id'], ['interview_stages.stage_id'], ),
    sa.PrimaryKeyConstraint('scorecard_id')
    )
    op.create_index(op.f('ix_scorecards_scorecard_id'), 'scorecards', ['scorecard_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_scorecards_scorecard_id'), table_name='scorecards')
    op.drop_table('scorecards')
    op.drop_index(op.f('ix_interview_stages_stage_id'), table_name='interview_stages')
    op.drop_table('interview_stages')
    op.drop_index(op.f('ix_candidates_candidate_id'), table_name='candidates')
    op.drop_table('candidates')