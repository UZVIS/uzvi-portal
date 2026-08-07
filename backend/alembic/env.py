from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context


config = context.config


if config.config_file_name is not None:
    fileConfig(config.config_file_name)


from app.database import Base

import app.modules.directory.models
import app.modules.onboarding.models
import app.modules.documents.models
import app.modules.leave.models
import app.modules.calendar.models
import app.modules.training.models
import app.modules.expense_claims.models
import app.modules.assets.models
import app.modules.consultant_utilization.models
import app.modules.recruiting.models
import app.modules.announcements.models
import app.modules.attendance.models
import app.modules.helpdesk.models
import app.modules.performance_goals.models

target_metadata = Base.metadata




def run_migrations_offline() -> None:

    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()