"""Store scanner discovery and normalized service inventory on scans."""

from alembic import op
import sqlalchemy as sa


revision = "7b2d7c2e9c4a"
down_revision = "1f2f5d06d836"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("scans", sa.Column("service_inventory", sa.JSON(), nullable=True))
    op.add_column("scans", sa.Column("discovery_snapshot", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("scans", "discovery_snapshot")
    op.drop_column("scans", "service_inventory")