"""Add content packages tables and source_package_id to policies

Revision ID: 002_content_packages
Revises: 001_baseline
Create Date: 2026-02-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002_content_packages"
down_revision: Union[str, None] = "001_baseline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "content_packages",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("age_min", sa.Integer(), nullable=True),
        sa.Column("age_max", sa.Integer(), nullable=True),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("icon", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_content_packages_category", "content_packages", ["category"])
    op.create_index("ix_content_packages_is_active", "content_packages", ["is_active"])

    op.create_table(
        "content_package_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("package_id", sa.Integer(), sa.ForeignKey("content_packages.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title_id", sa.Integer(), sa.ForeignKey("titles.id"), nullable=False),
        sa.Column("added_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("package_id", "title_id", name="_package_title_uc"),
    )
    op.create_index("ix_content_package_items_package_id", "content_package_items", ["package_id"])
    op.create_index("ix_content_package_items_title_id", "content_package_items", ["title_id"])

    op.create_table(
        "applied_packages",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("kid_profile_id", sa.Integer(), sa.ForeignKey("kid_profiles.id"), nullable=False),
        sa.Column("package_id", sa.Integer(), sa.ForeignKey("content_packages.id"), nullable=False),
        sa.Column("applied_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("kid_profile_id", "package_id", name="_kid_package_uc"),
    )
    op.create_index("ix_applied_packages_kid_profile_id", "applied_packages", ["kid_profile_id"])
    op.create_index("ix_applied_packages_package_id", "applied_packages", ["package_id"])

    op.create_table(
        "package_updates",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("kid_profile_id", sa.Integer(), sa.ForeignKey("kid_profiles.id"), nullable=False),
        sa.Column("package_id", sa.Integer(), sa.ForeignKey("content_packages.id"), nullable=False),
        sa.Column("title_id", sa.Integer(), sa.ForeignKey("titles.id"), nullable=False),
        sa.Column("status", sa.String(), server_default="pending"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_package_updates_kid_profile_id", "package_updates", ["kid_profile_id"])
    op.create_index("ix_package_updates_status", "package_updates", ["status"])

    op.add_column("policies", sa.Column("source_package_id", sa.Integer(), sa.ForeignKey("content_packages.id"), nullable=True))
    op.create_index("ix_policies_source_package_id", "policies", ["source_package_id"])


def downgrade() -> None:
    op.drop_index("ix_policies_source_package_id", table_name="policies")
    op.drop_column("policies", "source_package_id")
    op.drop_table("package_updates")
    op.drop_table("applied_packages")
    op.drop_table("content_package_items")
    op.drop_table("content_packages")
