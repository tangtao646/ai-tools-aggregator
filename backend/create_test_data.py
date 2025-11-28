#!/usr/bin/env python3
"""
创建测试数据用于验证推荐API
"""

from app.core.db import get_session
from app.models.tool import Tool, ReviewStatus
from datetime import datetime

def create_test_tools():
    """创建测试工具数据"""
    test_tools = [
        {
            "name": "ChatGPT",
            "slug": "chatgpt",
            "description": "OpenAI开发的强大对话AI助手",
            "short_description": "最先进的对话AI",
            "official_link": "https://chat.openai.com",
            "category": "对话助手",
            "pricing_model": "Freemium",
            "is_featured": True,
            "tags": ["AI", "对话", "写作"],
            "logo_url": "/static/logos/chatgpt.png",
            "review_status": ReviewStatus.PUBLISHED,
            "features": ["自然对话", "代码编写", "内容创作"],
            "use_cases": ["编程助手", "内容写作", "学习辅导"],
            "pros": ["响应速度快", "理解能力强", "多语言支持"],
            "cons": ["需要网络", "有时会犯错"],
            "rating": 4.8,
            "supported_platforms": ["Web", "iOS", "Android"]
        },
        {
            "name": "Claude AI",
            "slug": "claude-ai",
            "description": "Anthropic开发的AI助手，注重安全和可靠性",
            "short_description": "安全可靠的AI助手",
            "official_link": "https://claude.ai",
            "category": "对话助手",
            "pricing_model": "Freemium",
            "is_featured": True,
            "tags": ["AI", "对话", "安全"],
            "logo_url": "/static/logos/claude.png",
            "review_status": ReviewStatus.PUBLISHED,
            "features": ["安全对话", "长文本处理", "代码分析"],
            "use_cases": ["安全咨询", "文档分析", "编程"],
            "pros": ["安全性高", "处理长文本能力强", "推理能力优秀"],
            "cons": ["响应稍慢", "功能相对简单"],
            "rating": 4.7,
            "supported_platforms": ["Web"]
        },
        {
            "name": "Midjourney",
            "slug": "midjourney",
            "description": "强大的AI图像生成工具",
            "short_description": "AI艺术创作工具",
            "official_link": "https://midjourney.com",
            "category": "图像生成",
            "pricing_model": "Subscription",
            "is_featured": True,
            "tags": ["AI", "图像", "艺术"],
            "logo_url": "/static/logos/midjourney.png",
            "review_status": ReviewStatus.PUBLISHED,
            "features": ["高质量图像生成", "艺术风格转换", "批量处理"],
            "use_cases": ["艺术创作", "广告设计", "概念图绘制"],
            "pros": ["图像质量高", "艺术感强", "社区活跃"],
            "cons": ["需要订阅", "生成速度较慢"],
            "rating": 4.6,
            "supported_platforms": ["Discord", "Web"]
        },
        {
            "name": "DALL-E",
            "slug": "dall-e",
            "description": "OpenAI的AI图像生成模型",
            "short_description": "OpenAI图像生成工具",
            "official_link": "https://openai.com/dall-e",
            "category": "图像生成",
            "pricing_model": "Pay-per-use",
            "is_featured": False,
            "tags": ["AI", "图像", "OpenAI"],
            "logo_url": "/static/logos/dall-e.png",
            "review_status": ReviewStatus.PUBLISHED,
            "features": ["文本到图像", "图像编辑", "多种风格"],
            "use_cases": ["创意设计", "插图制作", "原型设计"],
            "pros": ["技术先进", "易于使用", "多种输出格式"],
            "cons": ["成本较高", "有时生成不准确"],
            "rating": 4.5,
            "supported_platforms": ["Web", "API"]
        },
        {
            "name": "GitHub Copilot",
            "slug": "github-copilot",
            "description": "AI编程助手，提升编码效率",
            "short_description": "AI编程助手",
            "official_link": "https://github.com/features/copilot",
            "category": "编程工具",
            "pricing_model": "Subscription",
            "is_featured": True,
            "tags": ["编程", "AI", "效率"],
            "logo_url": "/static/logos/copilot.png",
            "review_status": ReviewStatus.PUBLISHED,
            "features": ["代码补全", "函数生成", "错误修复"],
            "use_cases": ["软件开发", "代码重构", "学习编程"],
            "pros": ["大幅提升效率", "支持多种语言", "学习能力强"],
            "cons": ["需要订阅", "有时建议不准确"],
            "rating": 4.4,
            "supported_platforms": ["VS Code", "JetBrains", "Vim"]
        }
    ]

    db = next(get_session())
    try:
        for tool_data in test_tools:
            tool = Tool(**tool_data)
            db.add(tool)
        db.commit()
        print(f"Successfully created {len(test_tools)} test tools")
    except Exception as e:
        db.rollback()
        print(f"Error creating test tools: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_tools()