"""
测试工具详情 API 和新增字段
"""
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import get_session
from app.models.tool import Tool, ToolCreate
from datetime import datetime

def test_tool_detail_api():
    """测试工具详情 API"""
    print("🧪 测试工具详情 API...")

    with next(get_session()) as session:
        # 创建一个测试工具，包含所有新字段
        test_tool_data = {
            "name": "Test AI Tool with New Fields",
            "slug": "test-ai-tool-new-fields",
            "description": "This is a test tool to verify the new fields work correctly.",
            "short_description": "Test tool for new fields",
            "official_link": "https://example.com",
            "category": "测试工具",
            "pricing_model": "Free",
            "is_featured": True,
            "tags": ["AI", "Test", "New Fields"],
            "review_status": "PUBLISHED",
            "submitter_id": None,  # 避免外键问题
            "features": ["Feature 1", "Feature 2"],
            "use_cases": ["Use case 1", "Use case 2"],
            "pricing_details": "Free tier available",
            "pros": ["Pro 1", "Pro 2"],
            "cons": ["Con 1", "Con 2"],
            "rating": 4.5,
            "screenshots": ["https://example.com/screenshot1.jpg"],
            "video_url": "https://example.com/video.mp4",
            # 新增字段
            "supported_platforms": ["Web", "iOS", "Android"],
            "comparison_data": [
                {
                    "title": "vs Competitor A",
                    "image_url": "https://example.com/comparison1.jpg",
                    "description": "This tool is better than Competitor A in these aspects..."
                },
                {
                    "title": "vs Competitor B",
                    "image_url": "https://example.com/comparison2.jpg",
                    "description": "Compared to Competitor B, this tool offers..."
                }
            ],
            "alternatives": [
                {
                    "name": "Alternative Tool 1",
                    "logo_url": "https://example.com/alt1-logo.jpg",
                    "short_description": "A great alternative with similar features"
                },
                {
                    "name": "Alternative Tool 2",
                    "logo_url": "https://example.com/alt2-logo.jpg",
                    "short_description": "Another option for users looking for alternatives"
                }
            ]
        }

        # 创建工具实例
        tool_create = ToolCreate(**test_tool_data)
        tool = Tool.model_validate(tool_create)

        # 添加到数据库
        session.add(tool)
        session.commit()
        session.refresh(tool)

        print(f"✅ 成功创建测试工具，ID: {tool.id}")
        print(f"   - 支持平台: {tool.supported_platforms}")
        print(f"   - 对比数据数量: {len(tool.comparison_data) if tool.comparison_data else 0}")
        print(f"   - 替代工具数量: {len(tool.alternatives) if tool.alternatives else 0}")
        print(f"   - 更新时间: {tool.updated_at}")

        # 验证数据是否正确存储
        retrieved_tool = session.get(Tool, tool.id)
        if retrieved_tool:
            print("✅ 数据检索成功")
            print(f"   - supported_platforms: {retrieved_tool.supported_platforms}")
            print(f"   - comparison_data: {len(retrieved_tool.comparison_data) if retrieved_tool.comparison_data else 0} 项")
            print(f"   - alternatives: {len(retrieved_tool.alternatives) if retrieved_tool.alternatives else 0} 项")
        else:
            print("❌ 数据检索失败")

        return tool.id

if __name__ == "__main__":
    try:
        tool_id = test_tool_detail_api()
        print(f"\n🎉 测试完成！创建的工具 ID: {tool_id}")
        print("现在可以在前端测试工具详情页面了。")
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)