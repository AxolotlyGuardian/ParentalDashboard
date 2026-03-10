"""Add OTA releases table and dunning_step to subscriptions

Revision ID: 003
Revises: 002
Create Date: 2026-03-02
"""
from alembic import op
import sqlalchemy as sa

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    # Add dunning_step to subscriptions
    op.add_column('subscriptions', sa.Column('dunning_step', sa.Integer(), server_default='0'))

    # Create OTA releases table
    op.create_table(
        'ota_releases',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('version_name', sa.String(), nullable=False),
        sa.Column('version_code', sa.Integer(), nullable=False),
        sa.Column('channel', sa.String(), nullable=False, index=True),
        sa.Column('apk_url', sa.String(), nullable=False),
        sa.Column('sha256', sa.String(), nullable=False),
        sa.Column('min_version_code', sa.Integer(), server_default='0'),
        sa.Column('release_notes', sa.Text(), nullable=True),
        sa.Column('rollout_percentage', sa.Integer(), server_default='100'),
        sa.Column('is_active', sa.Boolean(), server_default='true', index=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('ota_releases')
    op.drop_column('subscriptions', 'dunning_step')
