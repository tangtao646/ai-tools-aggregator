"""初始化数据库表（使用 SQLModel.metadata.create_all）"""

import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlmodel import create_engine
from app.core.config import settings
from app.models.tool import Tool  # 导入工具模型
from app.models.admin import Admin  # 导入管理员模型
from app.models.user import User  # 导入用户模型

def init_database():
    """初始化数据库，创建所有表"""
    print("🚀 开始初始化数据库...")
    print(f"📍 数据库 URL: {settings.DATABASE_URL}")
    
    try:
        # 创建引擎
        engine = create_engine(
            str(settings.DATABASE_URL),
            echo=True,  # 打印 SQL 语句
            pool_pre_ping=True
        )
        
        # 导入所有模型的元数据
        from app.models.tool import SQLModel
        
        # 创建所有表
        print("\n📦 创建表结构...")
        SQLModel.metadata.create_all(engine)
        
        print("\n✅ 数据库初始化完成！")
        
    except Exception as e:
        print(f"\n❌ 数据库初始化失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    init_database()
