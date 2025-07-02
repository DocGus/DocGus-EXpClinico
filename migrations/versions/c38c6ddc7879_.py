"""empty message

Revision ID: c38c6ddc7879
Revises: e1e892199ce7
Create Date: 2025-06-21 00:40:09.756519

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c38c6ddc7879'
down_revision = 'e1e892199ce7'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('non_pathological_background', schema=None) as batch_op:
        batch_op.drop_column('origin')


def downgrade():
    with op.batch_alter_table('non_pathological_background', schema=None) as batch_op:
        batch_op.add_column(sa.Column('origin', sa.VARCHAR(
            length=120), autoincrement=False, nullable=True))
