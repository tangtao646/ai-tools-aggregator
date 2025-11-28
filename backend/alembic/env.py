from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

import sys
import os
# --- 1. 修正路径，将 backend 目录 (即 /app) 加入 Python 搜索路径 ---
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.join(current_dir, '..') # /backend
sys.path.append(backend_root)

# --- 2. 导入 SQLModel 和 db.py 模块 ---
from sqlmodel import SQLModel 
# 我们只需要导入 engine，但 SQLModel 会在下面获取元数据
from app.core.db import engine 

# --- 3. 导入所有模型文件（让 SQLModel.metadata 知道所有表的定义） ---
# 确保导入了所有包含继承自 SQLModel 的类的文件
from app.models import admin, category_mapping, tool, user, workflow_template

# ----------------------------------------------------
# 4. 设置正确的 target_metadata (使用 SQLModel.metadata)
# ----------------------------------------------------
target_metadata = SQLModel.metadata # ✅ 正确设置


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
        DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/aitools"

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
