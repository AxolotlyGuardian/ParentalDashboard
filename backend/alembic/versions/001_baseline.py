"""baseline - stamp existing schema

Revision ID: 001_baseline
Revises:
Create Date: 2026-02-27

This is a baseline migration that represents the existing database schema.
For new deployments, tables are created by SQLAlchemy's create_all().
For existing deployments, run: alembic stamp head
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_baseline"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Baseline migration: no-op for existing databases.
    # New databases should run Base.metadata.create_all() first,
    # then `alembic stamp head` to mark as current.
    pass


def downgrade() -> None:
    pass
