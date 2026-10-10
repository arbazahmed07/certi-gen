"""initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-10 18:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = '001_initial_schema'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        'generation_jobs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('idempotency_key', sa.String(length=128), nullable=True),
        sa.Column('event_name', sa.String(length=255), nullable=True),
        sa.Column('course_name', sa.String(length=255), nullable=False),
        sa.Column('issuer', sa.String(length=255), nullable=False),
        sa.Column('organization', sa.String(length=255), nullable=False),
        sa.Column('issue_date', sa.String(length=32), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('total_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('valid_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('invalid_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('pending_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('success_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('failed_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_summary', sa.Text(), nullable=True),
        sa.Column('archive_status', sa.String(length=32), nullable=False, server_default='none'),
        sa.Column('archive_storage_key', sa.String(length=512), nullable=True),
        sa.Column('archive_size_bytes', sa.BigInteger(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_generation_jobs_idempotency_key', 'generation_jobs', ['idempotency_key'], unique=True)
    op.create_index('ix_generation_jobs_status', 'generation_jobs', ['status'], unique=False)
    op.create_index('ix_jobs_status_created_at', 'generation_jobs', ['status', 'created_at'], unique=False)

    op.create_table(
        'recipient_certificates',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('job_id', sa.String(length=36), nullable=False),
        sa.Column('certificate_id', sa.String(length=64), nullable=False),
        sa.Column('recipient_name', sa.String(length=255), nullable=False),
        sa.Column('recipient_email', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('storage_key', sa.String(length=512), nullable=True),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=True),
        sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['job_id'], ['generation_jobs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_recipient_certificates_job_id', 'recipient_certificates', ['job_id'], unique=False)
    op.create_index('ix_recipient_certificates_certificate_id', 'recipient_certificates', ['certificate_id'], unique=True)
    op.create_index('ix_recipient_certificates_status', 'recipient_certificates', ['status'], unique=False)
    op.create_index('ix_recipients_job_status', 'recipient_certificates', ['job_id', 'status'], unique=False)
    op.create_index('ix_recipients_email', 'recipient_certificates', ['recipient_email'], unique=False)


def downgrade() -> None:
    op.drop_table('recipient_certificates')
    op.drop_table('generation_jobs')
