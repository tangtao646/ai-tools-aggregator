"""
添加 submitter_id 字段到 tool 表
用于关联提交者的用户 ID（适配 GitHub 等无邮箱的情况）
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('aitools.db')
    cursor = conn.cursor()
    
    try:
        # 添加 submitter_id 列（可为空，用于关联 user 表）
        cursor.execute("""
            ALTER TABLE tool 
            ADD COLUMN submitter_id INTEGER
        """)
        
        # 创建索引以提升查询性能
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tool_submitter_id 
            ON tool(submitter_id)
        """)
        
        conn.commit()
        print("✓ 成功添加 submitter_id INTEGER")
        print("✓ 成功创建索引 idx_tool_submitter_id")
        print("✅ 数据库迁移完成！")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("⚠️  submitter_id 列已存在，跳过迁移")
        else:
            print(f"❌ 迁移失败: {e}")
            raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
