"""
更新现有工具，添加新字段的测试数据
"""
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import get_session
from app.models.tool import Tool
from sqlmodel import select

def update_tool_with_new_fields():
    """更新现有工具，添加新字段数据"""
    print("🧪 更新现有工具，添加新字段数据...")

    with next(get_session()) as session:
        # 获取第一个工具进行更新
        statement = select(Tool).limit(1)
        tool = session.exec(statement).first()

        if not tool:
            print("❌ 没有找到工具")
            return

        print(f"📝 更新工具: {tool.name} (ID: {tool.id})")

        # 更新新字段
        tool.supported_platforms = ["Web", "iOS", "Android", "Desktop"]
        tool.comparison_data = [
            {
                "title": "vs Claude AI",
                "image_url": "https://example.com/comparison-claude.jpg",
                "description": "ChatGPT 在对话流畅性和多语言支持方面更胜一筹，而 Claude AI 在代码生成方面表现更优秀。"
            },
            {
                "title": "vs Gemini",
                "image_url": "https://example.com/comparison-gemini.jpg",
                "description": "Gemini 提供了更丰富的多模态功能，但 ChatGPT 的生态系统更为成熟。"
            }
        ]
        tool.alternatives = [
            {
                "name": "Claude AI",
                "logo_url": "https://example.com/claude-logo.jpg",
                "short_description": "Anthropic 开发的先进 AI 助手，注重安全和可靠性"
            },
            {
                "name": "Gemini",
                "logo_url": "https://example.com/gemini-logo.jpg",
                "short_description": "Google 的多模态 AI 模型，具有强大的图像和文本理解能力"
            },
            {
                "name": "Copilot",
                "logo_url": "https://example.com/copilot-logo.jpg",
                "short_description": "Microsoft 开发的 AI 编程助手，专为开发者设计"
            }
        ]

        session.add(tool)
        session.commit()
        session.refresh(tool)

        print("✅ 工具更新成功！")
        print(f"   - 支持平台: {tool.supported_platforms}")
        print(f"   - 对比数据: {len(tool.comparison_data)} 项")
        print(f"   - 替代工具: {len(tool.alternatives)} 项")
        print(f"   - 更新时间: {tool.updated_at}")

        return tool.id

if __name__ == "__main__":
    try:
        tool_id = update_tool_with_new_fields()
        print(f"\n🎉 更新完成！工具 ID: {tool_id}")
        print("现在可以在前端测试工具详情页面了。")
    except Exception as e:
        print(f"❌ 更新失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)