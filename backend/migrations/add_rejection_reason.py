import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.core.db import engine


def add_rejection_reason_column():
    """为 tool 表添加 rejection_reason 字段"""
    
    with Session(engine) as session:
        # 检查列是否已存在
        result = session.exec(
            text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='tool' AND column_name='rejection_reason'
            """)
        )
        if result.first():
            print("❌ rejection_reason 列已存在，跳过添加")
            return
        
        # 添加 rejection_reason 列
        session.exec(text("""
            ALTER TABLE tool 
            ADD COLUMN rejection_reason TEXT DEFAULT NULL;
        """))
        print("✓ 成功添加 rejection_reason 列")
        
        session.commit()
        print("\n✅ 数据库迁移完成！")


if __name__ == "__main__":
    add_rejection_reason_column()
