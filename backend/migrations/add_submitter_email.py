import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.core.db import engine


def add_submitter_email_column():
    """为 tool 表添加 submitter_email 字段"""
    
    with Session(engine) as session:
        # 检查列是否已存在
        result = session.exec(
            text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='tool' AND column_name='submitter_email'
            """)
        )
        if result.first():
            print("❌ submitter_email 列已存在，跳过添加")
            return
        
        # 添加 submitter_email 列
        session.exec(text("""
            ALTER TABLE tool 
            ADD COLUMN submitter_email VARCHAR(255) DEFAULT NULL;
        """))
        print("✓ 成功添加 submitter_email 列")
        
        # 创建索引以提高查询效率
        session.exec(text("""
            CREATE INDEX idx_tool_submitter_email ON tool(submitter_email);
        """))
        print("✓ 成功创建 idx_tool_submitter_email 索引")
        
        session.commit()
        print("\n✅ 数据库迁移完成！")


if __name__ == "__main__":
    add_submitter_email_column()
