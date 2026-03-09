"""Add device hardware fields, NPS surveys, weekly reports

Revision ID: 004
Revises: 003
Create Date: 2026-03-02
"""
from alembic import op
import sqlalchemy as sa

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    # Add hardware info + FCM fields to devices
    op.add_column('devices', sa.Column('device_model', sa.String(), nullable=True))
    op.add_column('devices', sa.Column('device_manufacturer', sa.String(), nullable=True))
    op.add_column('devices', sa.Column('app_version', sa.String(), nullable=True))
    op.add_column('devices', sa.Column('app_version_code', sa.Integer(), nullable=True))
    op.add_column('devices', sa.Column('fcm_token', sa.String(), nullable=True))

    # NPS surveys
    op.create_table(
        'nps_surveys',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('trigger_day', sa.Integer(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), server_default='pending'),
        sa.Column('shown_at', sa.DateTime(), nullable=True),
        sa.Column('responded_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Weekly reports
    op.create_table(
        'weekly_reports',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('week_start', sa.DateTime(), nullable=False),
        sa.Column('week_end', sa.DateTime(), nullable=False),
        sa.Column('report_data', sa.JSON(), nullable=False),
        sa.Column('email_sent', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('weekly_reports')
    op.drop_table('nps_surveys')
    op.drop_column('devices', 'fcm_token')
    op.drop_column('devices', 'app_version_code')
    op.drop_column('devices', 'app_version')
    op.drop_column('devices', 'device_manufacturer')
    op.drop_column('devices', 'device_model')
