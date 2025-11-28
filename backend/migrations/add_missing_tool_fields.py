"""
添加缺失的字段到 tool 表：supported_platforms, comparison_data, alternatives
"""
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.db import engine

def add_missing_columns():
    """添加缺失的列到 tool 表"""
    columns_to_add = [
        ('supported_platforms', 'TEXT'),  # JSON 存储的列表
        ('comparison_data', 'TEXT'),      # JSON 存储的字典列表
        ('alternatives', 'TEXT')          # JSON 存储的字典列表
    ]

    with engine.connect() as conn:
        for column_name, column_type in columns_to_add:
            try:
                # 检查列是否已存在 (PostgreSQL 方式)
                check_sql = text("""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name='tool' AND column_name=:column_name;
                """)
                result = conn.execute(check_sql, {"column_name": column_name})

                if result.fetchone():
                    print(f"✓ {column_name} 列已存在")
                    continue

                # 添加新列 (PostgreSQL 语法)
                alter_sql = text(f"ALTER TABLE tool ADD COLUMN {column_name} {column_type};")
                conn.execute(alter_sql)
                conn.commit()
                print(f"✓ 成功添加 {column_name} 列")

            except Exception as e:
                print(f"✗ 添加 {column_name} 列失败: {e}")
                continue

if __name__ == "__main__":
    try:
        add_missing_columns()
        print("✅ 迁移完成！")
    except Exception as e:
        print(f"✗ 迁移失败: {e}")
        sys.exit(1)