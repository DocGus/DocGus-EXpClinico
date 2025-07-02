"""empty message

Revision ID: cba0514e0de3
Revises: bdaa132466d4
Create Date: 2025-06-26 18:09:39.384790

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cba0514e0de3'
down_revision = 'bdaa132466d4'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('medical_file', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('student_validated_patient_id', sa.Integer(), nullable=True))
        batch_op.add_column(
            sa.Column('student_validated_patient_at', sa.DateTime(), nullable=True))
        batch_op.add_column(
            sa.Column('student_rejected_patient_id', sa.Integer(), nullable=True))
        batch_op.add_column(
            sa.Column('student_rejected_patient_at', sa.DateTime(), nullable=True))
        batch_op.create_foreign_key(
            'fk_medical_file_student_validated_patient_id_users',
            'users',
            ['student_validated_patient_id'],
            ['id']
        )
        batch_op.create_foreign_key(
            'fk_medical_file_student_rejected_patient_id_users',
            'users',
            ['student_rejected_patient_id'],
            ['id']
        )


def downgrade():
    with op.batch_alter_table('medical_file', schema=None) as batch_op:
        batch_op.drop_constraint(
            'fk_medical_file_student_validated_patient_id_users', type_='foreignkey')
        batch_op.drop_constraint(
            'fk_medical_file_student_rejected_patient_id_users', type_='foreignkey')
        batch_op.drop_column('student_rejected_patient_at')
        batch_op.drop_column('student_rejected_patient_id')
        batch_op.drop_column('student_validated_patient_at')
        batch_op.drop_column('student_validated_patient_id')
