"""
添加 logo_url 字段到 tool 表
"""
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.db import engine

def add_logo_url_column():
    """添加 logo_url 列到 tool 表"""
    with engine.connect() as conn:
        # 检查列是否已存在
        check_sql = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='tool' AND column_name='logo_url';
        """)
        result = conn.execute(check_sql)
        
        if result.fetchone():
            print("✓ logo_url 列已存在")
            return
        
        # 添加新列
        alter_sql = text("ALTER TABLE tool ADD COLUMN logo_url VARCHAR;")
        conn.execute(alter_sql)
        conn.commit()
        print("✓ 成功添加 logo_url 列")

if __name__ == "__main__":
    try:
        add_logo_url_column()
    except Exception as e:
        print(f"✗ 迁移失败: {e}")
        sys.exit(1)
