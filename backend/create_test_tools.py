"""
添加 10 条测试工具数据，包含所有新字段
使用直接 SQL 插入绕过外键约束检查
"""
import sys
import os
import json

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import engine
from sqlalchemy import text

def create_test_tools():
    """创建 10 条测试工具数据"""
    print("🧪 正在创建 10 条测试工具数据...")

    test_tools_data = [
        {
            "name": "ChatGPT",
            "slug": "chatgpt",
            "description": "OpenAI 开发的强大 AI 对话助手，能够进行自然语言对话、内容创作、编程辅助等多种任务。",
            "short_description": "OpenAI 的旗舰 AI 对话模型",
            "official_link": "https://chat.openai.com",
            "category": "对话助手",
            "pricing_model": "Freemium",
            "is_featured": True,
            "tags": json.dumps(["对话", "写作", "编程", "多语言"]),
            "review_status": "PUBLISHED",
            "submitter_id": None,
            "edit_count": 0,
            "features": json.dumps(["自然语言理解", "代码生成", "内容创作", "多语言支持"]),
            "use_cases": json.dumps(["编程辅助", "内容写作", "学习辅导", "创意生成"]),
            "pricing_details": "免费版 + Plus 订阅",
            "pros": json.dumps(["功能强大", "响应准确", "界面友好"]),
            "cons": json.dumps(["需要网络", "有时会犯错"]),
            "rating": 4.8,
            "screenshots": json.dumps(["https://example.com/chatgpt-1.jpg"]),
            "supported_platforms": json.dumps(["Web", "iOS", "Android", "Desktop"]),
            "comparison_data": json.dumps([
                {
                    "title": "vs Claude AI",
                    "image_url": "https://example.com/chatgpt-vs-claude.jpg",
                    "description": "ChatGPT 在对话流畅性上更胜一筹，Claude AI 在代码生成方面表现更优秀。"
                },
                {
                    "title": "vs Gemini",
                    "image_url": "https://example.com/chatgpt-vs-gemini.jpg",
                    "description": "Gemini 提供多模态功能，ChatGPT 的生态系统更为成熟。"
                }
            ]),
            "alternatives": json.dumps([
                {
                    "name": "Claude AI",
                    "logo_url": "https://example.com/claude-logo.jpg",
                    "short_description": "Anthropic 开发的注重安全的 AI 助手"
                },
                {
                    "name": "Gemini",
                    "logo_url": "https://example.com/gemini-logo.jpg",
                    "short_description": "Google 的多模态 AI 模型"
                }
            ])
        },
        {
            "name": "Midjourney",
            "slug": "midjourney",
            "description": "基于 AI 的图像生成工具，能够根据文本描述创建高质量的艺术图像。",
            "short_description": "AI 艺术图像生成器",
            "official_link": "https://www.midjourney.com",
            "category": "图像生成",
            "pricing_model": "Subscription",
            "is_featured": True,
            "tags": json.dumps(["图像生成", "艺术", "创意", "AI绘画"]),
            "review_status": "PUBLISHED",
            "submitter_id": None,
            "edit_count": 0,
            "features": json.dumps(["文本到图像", "风格转换", "高清输出", "批量生成"]),
            "use_cases": json.dumps(["艺术创作", "概念设计", "营销素材", "插图制作"]),
            "pricing_details": "每月 $10-$60",
            "pros": json.dumps(["图像质量高", "创意无限", "社区活跃"]),
            "cons": json.dumps(["需要订阅", "生成时间较长"]),
            "rating": 4.6,
            "screenshots": json.dumps(["https://example.com/midjourney-1.jpg"]),
            "supported_platforms": json.dumps(["Web", "Discord"]),
            "comparison_data": json.dumps([
                {
                    "title": "vs DALL-E",
                    "image_url": "https://example.com/midjourney-vs-dalle.jpg",
                    "description": "Midjourney 在艺术风格上更胜一筹，DALL-E 在通用图像生成方面表现更好。"
                }
            ]),
            "alternatives": json.dumps([
                {
                    "name": "DALL-E",
                    "logo_url": "https://example.com/dalle-logo.jpg",
                    "short_description": "OpenAI 的图像生成工具"
                },
                {
                    "name": "Stable Diffusion",
                    "logo_url": "https://example.com/sd-logo.jpg",
                    "short_description": "开源的图像生成模型"
                }
            ])
        },
        {
            "name": "GitHub Copilot",
            "slug": "github-copilot",
            "description": "GitHub 和 OpenAI 合作开发的 AI 编程助手，能够提供代码建议和自动补全。",
            "short_description": "AI 编程助手",
            "official_link": "https://github.com/features/copilot",
            "category": "编程工具",
            "pricing_model": "Subscription",
            "is_featured": False,
            "tags": json.dumps(["编程", "代码生成", "自动补全", "AI助手"]),
            "review_status": "PUBLISHED",
            "submitter_id": None,
            "edit_count": 0,
            "features": json.dumps(["代码补全", "函数生成", "注释解释", "错误修复"]),
            "use_cases": json.dumps(["软件开发", "代码重构", "学习编程", "快速原型"]),
            "pricing_details": "每月 $10",
            "pros": json.dumps(["提高效率", "减少重复工作", "学习辅助"]),
            "cons": json.dumps(["有时建议不准确", "需要付费"]),
            "rating": 4.4,
            "screenshots": json.dumps(["https://example.com/copilot-1.jpg"]),
            "supported_platforms": json.dumps(["VS Code", "JetBrains IDEs", "Neovim"]),
            "comparison_data": json.dumps([
                {
                    "title": "vs Tabnine",
                    "image_url": "https://example.com/copilot-vs-tabnine.jpg",
                    "description": "Copilot 的 AI 模型更强大，Tabnine 在企业集成方面表现更好。"
                }
            ]),
            "alternatives": json.dumps([
                {
                    "name": "Tabnine",
                    "logo_url": "https://example.com/tabnine-logo.jpg",
                    "short_description": "企业级的 AI 代码补全工具"
                },
                {
                    "name": "Kite",
                    "logo_url": "https://example.com/kite-logo.jpg",
                    "short_description": "免费的 AI 编程助手"
                }
            ])
        },
        {
            "name": "Notion AI",
            "slug": "notion-ai",
            "description": "Notion 集成的 AI 功能，帮助用户更高效地写作、整理信息和创建内容。",
            "short_description": "AI 增强的工作空间",
            "official_link": "https://www.notion.so/product/ai",
            "category": "生产力工具",
            "pricing_model": "Freemium",
            "is_featured": False,
            "tags": json.dumps(["笔记", "协作", "AI写作", "知识管理"]),
            "review_status": "PUBLISHED",
            "submitter_id": None,
            "edit_count": 0,
            "features": json.dumps(["智能写作", "内容总结", "翻译", "头脑风暴"]),
            "use_cases": json.dumps(["会议记录", "项目管理", "知识库建设", "创意写作"]),
            "pricing_details": "免费版 + AI 积分",
            "pros": json.dumps(["集成度高", "功能全面", "界面美观"]),
            "cons": json.dumps(["AI 积分有限", "学习成本较高"]),
            "rating": 4.2,
            "screenshots": json.dumps(["https://example.com/notion-ai-1.jpg"]),
            "supported_platforms": json.dumps(["Web", "iOS", "Android", "Desktop"]),
            "comparison_data": json.dumps([
                {
                    "title": "vs Roam Research",
                    "image_url": "https://example.com/notion-vs-roam.jpg",
                    "description": "Notion 更适合团队协作，Roam Research 在知识图谱方面更强大。"
                }
            ]),
            "alternatives": json.dumps([
                {
                    "name": "Roam Research",
                    "logo_url": "https://example.com/roam-logo.jpg",
                    "short_description": "双向链接的笔记工具"
                },
                {
                    "name": "Obsidian",
                    "logo_url": "https://example.com/obsidian-logo.jpg",
                    "short_description": "本地优先的知识管理工具"
                }
            ])
        },
        {
            "name": "Jasper",
            "slug": "jasper",
            "description": "专业的 AI 内容写作工具，专为营销人员和内容创作者设计。",
            "short_description": "AI 营销内容生成器",
            "official_link": "https://www.jasper.ai",
            "category": "内容创作",
            "pricing_model": "Subscription",
            "is_featured": False,
            "tags": json.dumps(["写作", "营销", "SEO", "内容生成"]),
            "review_status": "PUBLISHED",
            "submitter_id": None,
            "edit_count": 0,
            "features": json.dumps(["博客写作", "广告文案", "社交媒体", "SEO 优化"]),
            "use_cases": json.dumps(["营销内容", "博客文章", "广告创意", "社交媒体管理"]),
            "pricing_details": "每月 $39-$199",
            "pros": json.dumps(["专业性强", "模板丰富", "输出质量高"]),
            "cons": json.dumps(["价格较高", "学习曲线陡峭"]),
            "rating": 4.3,
            "screenshots": json.dumps(["https://example.com/jasper-1.jpg"]),
            "supported_platforms": json.dumps(["Web"]),
            "comparison_data": json.dumps([
                {
                    "title": "vs Copy.ai",
                    "image_url": "https://example.com/jasper-vs-copy.jpg",
                    "description": "Jasper 在长文本创作方面更优秀，Copy.ai 在快速文案生成方面表现更好。"
                }
            ]),
            "alternatives": json.dumps([
                {
                    "name": "Copy.ai",
                    "logo_url": "https://example.com/copy-logo.jpg",
                    "short_description": "快速 AI 文案生成工具"
                },
                {
                    "name": "Writesonic",
                    "logo_url": "https://example.com/writesonic-logo.jpg",
                    "short_description": "AI 驱动的内容创作平台"
                }
            ])
        },
        {
            "name": "Canva Magic Design",
            "slug": "canva-magic-design",
            "description": "Canva 集成的 AI 设计功能，让设计变得更加简单和智能。",
            "short_description": "AI 增强的图形设计工具",
            "official_link": "https://www.canva.com/magic-design",
            "category": "设计工具",
            "pricing_model": "Freemium",
            "is_featured": False,
            "tags": json.dumps(["设计", "AI", "图形", "模板"]),
            "review_status": "PUBLISHED",
            "submitter_id": None,
            "edit_count": 0,
            "features": json.dumps(["智能布局", "自动配色", "文本生成", "图像编辑"]),
            "use_cases": json.dumps(["海报设计", "社交媒体", "演示文稿", "营销材料"]),
            "pricing_details": "免费版 + Pro 订阅",
            "pros": json.dumps(["易于使用", "模板丰富", "AI 辅助强大"]),
            "cons": json.dumps(["高级功能需付费", "导出限制"]),
            "rating": 4.5,
            "screenshots": json.dumps(["https://example.com/canva-1.jpg"]),
            "supported_platforms": json.dumps(["Web", "iOS", "Android"]),
            "comparison_data": json.dumps([
                {
                    "title": "vs Adobe Sensei",
                    "image_url": "https://example.com/canva-vs-adobe.jpg",
                    "description": "Canva 更适合非专业用户，Adobe Sensei 在专业设计方面更强大。"
                }
            ]),
            "alternatives": json.dumps([
                {
                    "name": "Adobe Express",
                    "logo_url": "https://example.com/adobe-express-logo.jpg",
                    "short_description": "Adobe 的免费设计工具"
                },
                {
                    "name": "Figma",
                    "logo_url": "https://example.com/figma-logo.jpg",
                    "short_description": "协作式的界面设计工具"
                }
            ])
        },
        {
            "name": "Runway ML",
            "slug": "runway-ml",
            "description": "专业的 AI 视频编辑和生成平台，提供各种视觉效果和编辑功能。",
            "short_description": "AI 视频编辑和生成工具",
            "official_link": "https://runwayml.com",
            "category": "视频编辑",
            "pricing_model": "Freemium",
            "is_featured": False,
            "tags": json.dumps(["视频", "AI", "编辑", "生成"]),
            "review_status": "PUBLISHED",
            "submitter_id": None,
            "edit_count": 0,
            "features": json.dumps(["视频生成", "特效", "文字转语音", "图像到视频"]),
            "use_cases": json.dumps(["视频制作", "特效添加", "内容创作", "广告制作"]),
            "pricing_details": "免费版 + 积分购买",
            "pros": json.dumps(["功能强大", "创意无限", "专业级效果"]),
            "cons": json.dumps(["学习成本高", "处理时间长"]),
            "rating": 4.1,
            "screenshots": json.dumps(["https://example.com/runway-1.jpg"]),
            "supported_platforms": json.dumps(["Web"]),
            "comparison_data": json.dumps([
                {
                    "title": "vs Pika Labs",
                    "image_url": "https://example.com/runway-vs-pika.jpg",
                    "description": "Runway 在视频编辑方面更全面，Pika Labs 在快速生成方面更便捷。"
                }
            ]),
            "alternatives": json.dumps([
                {
                    "name": "Pika Labs",
                    "logo_url": "https://example.com/pika-logo.jpg",
                    "short_description": "AI 视频生成工具"
                },
                {
                    "name": "Synthesia",
                    "logo_url": "https://example.com/synthesia-logo.jpg",
                    "short_description": "AI 视频演示工具"
                }
            ])
        },
        {
            "name": "Anthropic Claude",
            "slug": "anthropic-claude",
            "description": "Anthropic 开发的 AI 助手，注重安全性和可靠性。",
            "short_description": "注重安全的 AI 对话助手",
            "official_link": "https://www.anthropic.com/claude",
            "category": "对话助手",
            "pricing_model": "Freemium",
            "is_featured": False,
            "tags": json.dumps(["对话", "安全", "可靠", "编程"]),
            "review_status": "PUBLISHED",
            "submitter_id": None,
            "edit_count": 0,
            "features": json.dumps(["安全对话", "代码生成", "分析能力", "长文本处理"]),
            "use_cases": json.dumps(["安全研究", "代码开发", "数据分析", "学术研究"]),
            "pricing_details": "免费版 + 企业版",
            "pros": json.dumps(["安全性高", "推理能力强", "适合专业应用"]),
            "cons": json.dumps(["功能相对简单", "访问受限"]),
            "rating": 4.3,
            "screenshots": json.dumps(["https://example.com/claude-1.jpg"]),
            "supported_platforms": json.dumps(["Web", "API"]),
            "comparison_data": json.dumps([
                {
                    "title": "vs ChatGPT",
                    "image_url": "https://example.com/claude-vs-chatgpt.jpg",
                    "description": "Claude 在安全性和推理方面更优秀，ChatGPT 在通用对话方面更流畅。"
                }
            ]),
            "alternatives": json.dumps([
                {
                    "name": "ChatGPT",
                    "logo_url": "https://example.com/chatgpt-logo.jpg",
                    "short_description": "OpenAI 的通用 AI 助手"
                },
                {
                    "name": "Bard",
                    "logo_url": "https://example.com/bard-logo.jpg",
                    "short_description": "Google 的对话式 AI"
                }
            ])
        },
        {
            "name": "Perplexity AI",
            "slug": "perplexity-ai",
            "description": "AI 驱动的搜索引擎，能够提供准确的答案和来源引用。",
            "short_description": "AI 增强的搜索引擎",
            "official_link": "https://www.perplexity.ai",
            "category": "搜索引擎",
            "pricing_model": "Freemium",
            "is_featured": False,
            "tags": json.dumps(["搜索", "AI", "引用", "研究"]),
            "review_status": "PUBLISHED",
            "submitter_id": None,
            "edit_count": 0,
            "features": json.dumps(["智能搜索", "来源引用", "答案解释", "实时更新"]),
            "use_cases": json.dumps(["学术研究", "事实核查", "学习辅助", "专业查询"]),
            "pricing_details": "免费版 + Pro 订阅",
            "pros": json.dumps(["答案准确", "来源可靠", "界面简洁"]),
            "cons": json.dumps(["功能相对基础", "搜索范围有限"]),
            "rating": 4.0,
            "screenshots": json.dumps(["https://example.com/perplexity-1.jpg"]),
            "supported_platforms": json.dumps(["Web", "iOS", "Android"]),
            "comparison_data": json.dumps([
                {
                    "title": "vs Google Search",
                    "image_url": "https://example.com/perplexity-vs-google.jpg",
                    "description": "Perplexity 提供更准确的答案，Google 提供更广泛的搜索结果。"
                }
            ]),
            "alternatives": json.dumps([
                {
                    "name": "Google Search",
                    "logo_url": "https://example.com/google-logo.jpg",
                    "short_description": "全球最大的搜索引擎"
                },
                {
                    "name": "Bing AI",
                    "logo_url": "https://example.com/bing-logo.jpg",
                    "short_description": "Microsoft 的 AI 搜索引擎"
                }
            ])
        },
        {
            "name": "Cursor",
            "slug": "cursor",
            "description": "基于 AI 的代码编辑器，提供智能代码补全和编程辅助。",
            "short_description": "AI 驱动的代码编辑器",
            "official_link": "https://cursor.sh",
            "category": "编程工具",
            "pricing_model": "Freemium",
            "is_featured": False,
            "tags": json.dumps(["编程", "编辑器", "AI", "代码生成"]),
            "review_status": "PUBLISHED",
            "submitter_id": None,
            "edit_count": 0,
            "features": json.dumps(["智能补全", "代码解释", "重构建议", "多语言支持"]),
            "use_cases": json.dumps(["软件开发", "代码学习", "快速原型", "团队协作"]),
            "pricing_details": "免费版 + Pro 订阅",
            "pros": json.dumps(["AI 功能强大", "界面现代化", "响应速度快"]),
            "cons": json.dumps(["相对较新", "生态系统小"]),
            "rating": 4.2,
            "screenshots": json.dumps(["https://example.com/cursor-1.jpg"]),
            "supported_platforms": json.dumps(["Desktop"]),
            "comparison_data": json.dumps([
                {
                    "title": "vs VS Code + Copilot",
                    "image_url": "https://example.com/cursor-vs-vscode.jpg",
                    "description": "Cursor 提供更集成的 AI 体验，VS Code + Copilot 提供更多扩展性。"
                }
            ]),
            "alternatives": json.dumps([
                {
                    "name": "VS Code",
                    "logo_url": "https://example.com/vscode-logo.jpg",
                    "short_description": "微软的开源代码编辑器"
                },
                {
                    "name": "GitHub Copilot",
                    "logo_url": "https://example.com/copilot-logo.jpg",
                    "short_description": "GitHub 的 AI 编程助手"
                }
            ])
        }
    ]

    with engine.connect() as conn:
        for i, tool_data in enumerate(test_tools_data, 1):
            try:
                # 直接使用 SQL 插入数据，绕过外键约束检查
                insert_sql = text("""
                    INSERT INTO tool (
                        name, slug, description, short_description, official_link, category,
                        pricing_model, is_featured, tags, review_status, submitter_id,
                        edit_count, features, use_cases, pricing_details, pros, cons, rating,
                        screenshots, supported_platforms, comparison_data, alternatives,
                        created_at, updated_at
                    ) VALUES (
                        :name, :slug, :description, :short_description, :official_link, :category,
                        :pricing_model, :is_featured, :tags, :review_status, :submitter_id,
                        :edit_count, :features, :use_cases, :pricing_details, :pros, :cons, :rating,
                        :screenshots, :supported_platforms, :comparison_data, :alternatives,
                        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    )
                """)

                conn.execute(insert_sql, tool_data)
                conn.commit()

                print(f"✅ 创建工具 {i}/10: {tool_data['name']}")

            except Exception as e:
                print(f"❌ 创建工具失败 {i}/10: {tool_data['name']} - {e}")
                conn.rollback()
                continue

        print("🎉 所有测试工具创建完成！")

if __name__ == "__main__":
    try:
        create_test_tools()
    except Exception as e:
        print(f"❌ 脚本执行失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)