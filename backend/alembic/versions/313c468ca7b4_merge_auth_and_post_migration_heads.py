"""merge auth and post migration heads

Revision ID: 313c468ca7b4
Revises: 03b91e54ae5e, 78961136180e
Create Date: 2026-06-22 17:18:12.904629

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '313c468ca7b4'
down_revision: Union[str, None] = ('03b91e54ae5e', '78961136180e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
