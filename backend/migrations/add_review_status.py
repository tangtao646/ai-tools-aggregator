"""
添加 review_status 字段到 tool 表
"""
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.db import engine

def add_review_status_column():
    """添加 review_status 列到 tool 表"""
    with engine.connect() as conn:
        # 检查列是否已存在
        check_sql = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='tool' AND column_name='review_status';
        """)
        result = conn.execute(check_sql)
        
        if result.fetchone():
            print("✓ review_status 列已存在")
            return
        
        # 添加新列，默认值为 0 (待审核)
        alter_sql = text("ALTER TABLE tool ADD COLUMN review_status INTEGER DEFAULT 0 NOT NULL;")
        conn.execute(alter_sql)
        
        # 创建索引以优化查询
        index_sql = text("CREATE INDEX IF NOT EXISTS idx_tool_review_status ON tool(review_status);")
        conn.execute(index_sql)
        
        conn.commit()
        print("✓ 成功添加 review_status 列和索引")

if __name__ == "__main__":
    try:
        add_review_status_column()
    except Exception as e:
        print(f"✗ 迁移失败: {e}")
        sys.exit(1)
