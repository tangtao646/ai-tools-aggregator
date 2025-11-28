# backend/app/core/db.py
from sqlmodel import create_engine, Session, SQLModel
from app.core.config import settings

# 数据库引擎
# echo=True 会打印所有执行的 SQL 语句，开发时很有用
engine = create_engine(settings.DATABASE_URL,
    echo=True,
    pool_recycle=3600 )

def create_db_and_tables():
    """
    创建数据库和表结构。仅用于开发和首次启动。
    在生产环境推荐使用数据库迁移工具 (如 Alembic)。
    """
    SQLModel.metadata.create_all(engine)

def get_session():
    """
    获取数据库会话的依赖注入函数 (FastAPI Dependencies)。
    """
    with Session(engine) as session:
        yield session