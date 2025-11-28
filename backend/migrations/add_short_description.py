"""
添加 short_description 字段到 tool 表
"""
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.db import engine

def add_short_description_column():
    """添加 short_description 列到 tool 表"""
    with engine.connect() as conn:
        # 检查列是否已存在
        check_sql = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='tool' AND column_name='short_description';
        """)
        result = conn.execute(check_sql)
        
        if result.fetchone():
            print("✓ short_description 列已存在")
            return
        
        # 添加新列
        alter_sql = text("ALTER TABLE tool ADD COLUMN short_description VARCHAR;")
        conn.execute(alter_sql)
        conn.commit()
        print("✓ 成功添加 short_description 列")

if __name__ == "__main__":
    try:
        add_short_description_column()
    except Exception as e:
        print(f"✗ 迁移失败: {e}")
        sys.exit(1)
