"""
清除 tools 表的所有数据
"""
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import get_session
from app.models.tool import Tool
from sqlmodel import delete

def clear_tools_table():
    """清除 tools 表的所有数据"""
    print("🗑️ 正在清除 tools 表的所有数据...")

    with next(get_session()) as session:
        # 删除所有工具数据
        statement = delete(Tool)
        result = session.execute(statement)
        session.commit()

        print(f"✅ 已删除 {result.rowcount} 条工具数据")

if __name__ == "__main__":
    try:
        clear_tools_table()
        print("🎉 tools 表数据清除完成！")
    except Exception as e:
        print(f"❌ 清除失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)