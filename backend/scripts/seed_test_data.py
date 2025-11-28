#!/usr/bin/env python3
# backend/scripts/seed_test_data.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import get_session
from app.models.tool import Tool, ReviewStatus
from datetime import datetime
import json

def create_test_tools():
    """创建测试工具数据"""

    # 测试数据
    test_tools = [
        {
            "name": "ChatGPT",
            "slug": "chatgpt",
            "description": "OpenAI开发的强大AI对话助手，能够进行自然语言对话、代码编写、内容创作等多种任务。",
            "short_description": "OpenAI开发的AI对话助手",
            "category": "对话助手",
            "official_link": "https://chat.openai.com",
            "pricing_model": "Freemium",
            "pricing_details": "免费版提供基础功能，Plus版本每月20美元",
            "is_featured": True,
            "tags": ["AI", "对话", "OpenAI", "GPT"],
            "features": [
                "自然语言对话",
                "代码编写和调试",
                "内容创作",
                "多语言支持",
                "实时对话"
            ],
            "use_cases": [
                "编程助手",
                "内容创作",
                "学习辅导",
                "创意写作"
            ],
            "supported_platforms": ["Web", "iOS", "Android", "Desktop"],
            "comparison_data": [
                {
                    "title": "vs Claude AI",
                    "image_url": "https://example.com/chatgpt-vs-claude.jpg",
                    "description": "ChatGPT在对话流畅性上更胜一筹，Claude AI在代码生成方面表现更优秀。"
                },
                {
                    "title": "vs Gemini",
                    "image_url": "https://example.com/chatgpt-vs-gemini.jpg",
                    "description": "Gemini提供多模态功能，ChatGPT的生态系统更加成熟。"
                }
            ],
            "alternatives": [
                {
                    "name": "Claude AI",
                    "logo_url": "https://example.com/claude-logo.jpg",
                    "short_description": "Anthropic开发的注重安全的AI助手"
                },
                {
                    "name": "Gemini",
                    "logo_url": "https://example.com/gemini-logo.jpg",
                    "short_description": "Google的多模态AI模型"
                }
            ],
            "pros": [
                "对话流畅自然",
                "功能丰富全面",
                "生态系统成熟",
                "响应速度快"
            ],
            "cons": [
                "需要网络连接",
                "高级功能收费",
                "偶尔出现幻觉"
            ],
            "faqs": [
                {
                    "question": "ChatGPT可以用来编程吗？",
                    "answer": "是的，ChatGPT可以帮助编写、调试和优化代码，支持多种编程语言。"
                },
                {
                    "question": "ChatGPT支持哪些语言？",
                    "answer": "ChatGPT支持多种语言，包括中文、英文等主要语言。"
                }
            ],
            "rating": 4.5,
            "review_status": ReviewStatus.PUBLISHED
        },
        {
            "name": "Claude AI",
            "slug": "claude-ai",
            "description": "Anthropic开发的AI助手，注重安全性和可靠性，在代码生成和分析方面表现出色。",
            "short_description": "Anthropic开发的注重安全的AI助手",
            "category": "对话助手",
            "official_link": "https://claude.ai",
            "pricing_model": "Freemium",
            "pricing_details": "免费版提供基础功能，Pro版本每月20美元",
            "is_featured": False,
            "tags": ["AI", "对话", "Anthropic", "安全"],
            "features": [
                "安全优先设计",
                "优秀的代码生成",
                "长文本处理",
                "多语言支持",
                "实时协作"
            ],
            "use_cases": [
                "代码开发",
                "文档分析",
                "创意写作",
                "学术研究"
            ],
            "supported_platforms": ["Web", "iOS", "Android"],
            "comparison_data": [
                {
                    "title": "vs ChatGPT",
                    "image_url": "https://example.com/claude-vs-chatgpt.jpg",
                    "description": "Claude在代码生成方面更优秀，ChatGPT在对话流畅性上更胜一筹。"
                }
            ],
            "alternatives": [
                {
                    "name": "ChatGPT",
                    "logo_url": "https://example.com/chatgpt-logo.jpg",
                    "short_description": "OpenAI开发的强大AI对话助手"
                },
                {
                    "name": "Gemini",
                    "logo_url": "https://example.com/gemini-logo.jpg",
                    "short_description": "Google的多模态AI模型"
                }
            ],
            "pros": [
                "安全性高",
                "代码生成优秀",
                "长文本处理能力强",
                "界面简洁"
            ],
            "cons": [
                "功能相对简单",
                "生态系统较小",
                "学习成本稍高"
            ],
            "faqs": [
                {
                    "question": "Claude AI适合编程吗？",
                    "answer": "非常适合！Claude在代码生成、调试和优化方面表现出色。"
                }
            ],
            "rating": 4.3,
            "review_status": ReviewStatus.PUBLISHED
        },
        {
            "name": "Gemini",
            "slug": "gemini",
            "description": "Google开发的Gemini AI模型，支持文本、图像等多种模态的AI交互。",
            "short_description": "Google的多模态AI模型",
            "category": "多模态AI",
            "official_link": "https://gemini.google.com",
            "pricing_model": "Free",
            "pricing_details": "目前提供免费使用",
            "is_featured": False,
            "tags": ["AI", "多模态", "Google", "图像"],
            "features": [
                "多模态交互",
                "图像理解",
                "代码编写",
                "实时对话",
                "Google服务集成"
            ],
            "use_cases": [
                "图像分析",
                "创意设计",
                "编程助手",
                "教育学习"
            ],
            "supported_platforms": ["Web", "Android", "iOS"],
            "comparison_data": [
                {
                    "title": "vs ChatGPT",
                    "image_url": "https://example.com/gemini-vs-chatgpt.jpg",
                    "description": "Gemini提供多模态功能，ChatGPT的生态系统更加成熟。"
                }
            ],
            "alternatives": [
                {
                    "name": "ChatGPT",
                    "logo_url": "https://example.com/chatgpt-logo.jpg",
                    "short_description": "OpenAI开发的强大AI对话助手"
                },
                {
                    "name": "Claude AI",
                    "logo_url": "https://example.com/claude-logo.jpg",
                    "short_description": "Anthropic开发的注重安全的AI助手"
                }
            ],
            "pros": [
                "多模态能力强",
                "Google生态集成",
                "免费使用",
                "图像处理优秀"
            ],
            "cons": [
                "中文支持一般",
                "功能相对基础",
                "网络依赖性强"
            ],
            "faqs": [
                {
                    "question": "Gemini支持图像处理吗？",
                    "answer": "是的，Gemini支持图像理解、分析和基于图像的对话。"
                }
            ],
            "rating": 4.0,
            "review_status": ReviewStatus.PUBLISHED
        }
    ]

    # 获取数据库会话
    db = next(get_session())

    try:
        for tool_data in test_tools:
            # 将列表转换为JSON字符串存储
            tool_dict = tool_data.copy()
            tool_dict['supported_platforms'] = json.dumps(tool_data['supported_platforms'])
            tool_dict['comparison_data'] = json.dumps(tool_data['comparison_data'])
            tool_dict['alternatives'] = json.dumps(tool_data['alternatives'])
            tool_dict['features'] = tool_data['features']
            tool_dict['use_cases'] = tool_data['use_cases']
            tool_dict['pros'] = tool_data.get('pros', [])
            tool_dict['cons'] = tool_data.get('cons', [])
            tool_dict['faqs'] = tool_data.get('faqs', [])

            # 创建工具对象
            tool = Tool(**tool_dict)
            db.add(tool)

        db.commit()
        print(f"成功创建了 {len(test_tools)} 个测试工具")

        # 验证数据
        tools = db.query(Tool).all()
        print("\n创建的工具列表:")
        for tool in tools:
            print(f"- {tool.name} (slug: {tool.slug})")

    except Exception as e:
        print(f"创建测试数据失败: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_tools()