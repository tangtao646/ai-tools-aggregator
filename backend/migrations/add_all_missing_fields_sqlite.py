"""
为 SQLite 数据库添加所有缺失字段的完整迁移
"""
import sqlite3

def migrate():
    conn = sqlite3.connect('aitools.db')
    cursor = conn.cursor()
    
    # 获取现有列
    cursor.execute("PRAGMA table_info(tool)")
    existing_columns = {row[1] for row in cursor.fetchall()}
    
    print("现有字段:", existing_columns)
    print("\n开始添加缺失字段...\n")
    
    # 需要添加的字段及其定义
    fields_to_add = [
        ('tags', 'TEXT DEFAULT "[]"'),  # JSON 数组
        ('logo_url', 'VARCHAR'),
        ('short_description', 'VARCHAR DEFAULT ""'),
        ('review_status', 'INTEGER DEFAULT 0'),
        ('rejection_reason', 'TEXT'),
        ('submitter_email', 'VARCHAR'),
        ('edit_count', 'INTEGER DEFAULT 0'),
        ('features', 'TEXT'),  # JSON 数组
        ('use_cases', 'TEXT'),  # JSON 数组
        ('pricing_details', 'TEXT'),
    ]
    
    added_count = 0
    for field_name, field_type in fields_to_add:
        if field_name not in existing_columns:
            try:
                cursor.execute(f'ALTER TABLE tool ADD COLUMN {field_name} {field_type}')
                print(f"✓ 成功添加字段: {field_name} ({field_type})")
                added_count += 1
            except sqlite3.OperationalError as e:
                print(f"❌ 添加 {field_name} 失败: {e}")
        else:
            print(f"⊙ 字段已存在: {field_name}")
    
    # 创建索引
    indexes = [
        ('idx_tool_review_status', 'review_status'),
        ('idx_tool_submitter_email', 'submitter_email'),
    ]
    
    print("\n创建索引...\n")
    for index_name, column in indexes:
        try:
            cursor.execute(f'CREATE INDEX IF NOT EXISTS {index_name} ON tool({column})')
            print(f"✓ 成功创建索引: {index_name}")
        except sqlite3.OperationalError as e:
            print(f"⊙ 索引已存在或失败: {index_name}")
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ 迁移完成！共添加 {added_count} 个字段")

if __name__ == "__main__":
    migrate()
