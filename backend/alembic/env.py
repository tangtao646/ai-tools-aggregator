from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

import sys
import os
# 将项目根目录添加到路径，以便导入您的应用模块
sys.path.append(os.path.join(os.getcwd()))

# 2. 导入 Base 和您的模型
# 假设 Base 对象在 backend/app/core/db.py 中，且名为 Base
from app.core.db import Base 
target_metadata = Base.metadata

# 导入所有模型，确保 Alembic 能够发现它们
# 否则 Alembic 无法知道要创建哪些表
# 导入 models 目录下所有的 Python 文件 (除了 __init__ 和 schemas)
from app.models import admin, category_mapping, tool, user, workflow_template

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = None

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
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
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    import os
    from sqlalchemy import create_engine
    
    DATABASE_URL = os.environ.get("DATABASE_URL")
    if not DATABASE_URL:
        # 本地开发 URL - 确保与您本地环境匹配
        DATABASE_URL = "postgresql+psycopg2://user:password@localhost/localdb"

    connectable = create_engine(DATABASE_URL)

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
