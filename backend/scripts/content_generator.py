#!/usr/bin/env python3
"""
AI Tools SEO Content Generator
功能：从simple_tools.json读取基础数据，生成完整的SEO友好的Tool模型数据并写入seo_tools.json
使用高质量提示词模版生成专业内容
"""

import os
import json
import yaml
import random
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging
import sys
from datetime import datetime
import time

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent.parent))

from app.core.db import get_session
from app.models.tool import Tool, ReviewStatus
from app.utils.slug import generate_unique_slug

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AIToolsSEOGenerator:
    """AI工具SEO内容生成器"""

    def __init__(self, api_key: Optional[str] = None, model: str = "gemini-2.5-flash"):
        """
        初始化生成器

        Args:
            api_key: Google API 密钥
            model: 使用的模型
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY") or self._load_api_key_from_config()
        if not self.api_key:
            logger.warning("Google API key not found. Will use fallback generation.")

        self.model = model
        self.client = None

        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info(f"Google Gemini initialized with model: {model}")
            except ImportError:
                logger.warning("Google Genai not installed. Using fallback generation.")

        # 分类映射 (英文标识符 -> 中文显示名称)
        self.category_mapping = {
            "Chat": "对话",
            "Image": "图像",
            "Code": "代码",
            "Writing": "写作",
            "Video": "视频",
            "Music": "音乐",
            "Analysis": "分析",
            "Translation": "翻译",
            "Recognition": "语音识别",
            "Design": "设计",
            "Marketing": "营销",
            "Education": "教育",
            "Productivity": "生产力",
            "API": "API服务",
            "General": "通用",
            "LLM": "大语言模型",
            "Search": "搜索",
            "Research": "研究",
            "Text": "文本",
            "Office": "办公",
            "Script": "脚本",
            "Audio": "音频",
            "Podcast": "播客",
            "Legal": "法律",
            "Automation": "自动化",
            "Meeting": "会议",
            "Summary": "摘要",
            "Transcription": "转录",
            "No Code": "无代码",
            "Utility": "实用",
            "Workflow": "工作流",
            "3D": "三维",
        }
        self.categories = list(self.category_mapping.keys()) # 英文分类列表

    def _load_api_key_from_config(self) -> Optional[str]:
        """从 config.yaml 加载 API Key"""
        config_path = Path(__file__).parent / "config.yaml"
        if config_path.exists():
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config = yaml.safe_load(f)
                    api_key = config.get('gemini', {}).get('api_key')
                    if api_key:
                        logger.info("✓ Loaded API key from config.yaml")
                        return api_key
            except Exception as e:
                logger.warning(f"Failed to load config.yaml: {e}")
        return None

    def load_simple_tools(self, input_file: str = "simple_tools.json") -> List[Dict]:
        """加载基础工具数据"""
        input_path = Path(__file__).parent / input_file
        if not input_path.exists():
            raise FileNotFoundError(f"Input file not found: {input_path}")

        with open(input_path, 'r', encoding='utf-8') as f:
            tools = json.load(f)

        logger.info(f"Loaded {len(tools)} tools from {input_file}")
        return tools

    def determine_primary_category(self, categories: List[str]) -> str:
        """
        根据分类数组确定主要分类（返回英文标识符）
        """
        for cat_en in self.categories:
            if cat_en in categories: # 检查simple_tools.json中的英文tag是否在我们的英文分类列表中
                return cat_en
        # 如果simple_tools.json中的tag没有直接匹配，尝试从category_mapping中反向查找
        for simple_cat in categories:
            for en_cat, zh_cat in self.category_mapping.items():
                if simple_cat == zh_cat: # 如果simple_tools.json中是中文，找到对应的英文
                    return en_cat
        return categories[0] if categories else "General Purpose AI"

    def generate_tool_features(self, name: str, categories: List[str], primary_category: str) -> List[str]:
        """生成工具功能列表"""
        features = []

        # 基于分类生成通用功能
        if "Chat" in categories or primary_category == "对话助手":
            features.extend(["自然语言对话", "多轮对话", "上下文理解", "智能问答"])
        if "Image" in categories or "Art" in categories or primary_category in ["图像生成", "艺术生成"]:
            features.extend(["高质量图像生成", "多种艺术风格", "自定义参数控制", "批量处理"])
        if "Video" in categories or primary_category == "视频工具":
            features.extend(["视频编辑", "特效处理", "格式转换", "智能剪辑"])
        if "Audio" in categories or primary_category == "音频工具":
            features.extend(["音频生成", "语音合成", "音效处理", "格式转换"])
        if "Coding" in categories or "Code" in categories or primary_category == "编程工具":
            features.extend(["代码生成", "语法检查", "智能补全", "代码优化"])
        if "Text" in categories or primary_category == "文本处理":
            features.extend(["文本分析", "内容生成", "格式转换", "语言翻译"])

        # 去重并限制数量
        unique_features = list(set(features))
        return unique_features[:6] if len(unique_features) > 6 else unique_features

    def generate_use_cases(self, name: str, categories: List[str], primary_category: str) -> List[str]:
        """生成使用场景"""
        use_cases = []

        if "Chat" in categories or primary_category == "对话助手":
            use_cases.extend(["智能客服", "内容创作辅助", "学习辅导", "编程助手"])
        if "Image" in categories or primary_category in ["图像生成", "艺术生成"]:
            use_cases.extend(["广告设计", "产品原型", "社交媒体内容", "艺术创作"])
        if "Video" in categories or primary_category == "视频工具":
            use_cases.extend(["视频制作", "内容营销", "教育视频", "直播剪辑"])
        if "Audio" in categories or primary_category == "音频工具":
            use_cases.extend(["播客制作", "有声书制作", "音乐创作", "语音内容"])
        if "Coding" in categories or primary_category == "编程工具":
            use_cases.extend(["软件开发", "代码重构", "技术学习", "原型开发"])
        if "Text" in categories or primary_category == "文本处理":
            use_cases.extend(["文档处理", "内容营销", "学术写作", "翻译服务"])

        return list(set(use_cases))[:5]

    def generate_key_differentiators(self, name: str, categories: List[str], primary_category: str) -> List[str]:
        """生成关键差异化特性"""
        differentiators = []

        # 基于工具名称的特殊差异化
        name_lower = name.lower()
        if "chatgpt" in name_lower:
            differentiators.extend([
                "GPT-4架构，复杂推理能力领先",
                "多模态理解，支持文本、代码、数学",
                "OpenAI生态系统深度集成",
                "持续更新的知识库"
            ])
        elif "claude" in name_lower:
            differentiators.extend([
                "Anthropic安全优先设计",
                "长文本处理能力卓越",
                "注重真实性和可靠性",
                "企业级安全合规"
            ])
        elif "midjourney" in name_lower:
            differentiators.extend([
                "Discord原生集成，社区驱动",
                "艺术风格多样化，审美在线",
                "快速迭代，参数调整灵活",
                "高质量输出，商业可用"
            ])
        elif "github" in name_lower and "copilot" in name_lower:
            differentiators.extend([
                "GitHub生态深度集成",
                "多语言代码生成支持",
                "上下文感知，代码质量高",
                "企业级安全和隐私保护"
            ])
        elif "gemini" in name_lower:
            differentiators.extend([
                "Google多模态能力",
                "实时搜索集成",
                "跨平台设备同步",
                "Google Workspace深度集成"
            ])
        else:
            # 通用差异化特性
            differentiators.extend([
                f"专注于{primary_category}领域",
                "AI驱动的智能化体验",
                "用户界面友好易用",
                "持续学习和优化"
            ])

        # 基于分类添加通用差异化
        if "对话助手" in primary_category:
            differentiators.append("自然语言处理领先")
        elif "图像生成" in primary_category:
            differentiators.append("高质量视觉内容生成")
        elif "编程工具" in primary_category:
            differentiators.append("代码生成和优化能力")
        elif "写作助手" in primary_category:
            differentiators.append("内容创作效率提升")

        # 去重并限制数量
        return list(set(differentiators))[:5]

    def generate_pricing_model(self, name: str, categories: List[str]) -> str:
        """生成定价模式"""
        # 基于工具名称和分类推断定价模式，始终输出英文标识符
        free_keywords = ["open source", "free", "开源"]
        subscription_keywords = ["copilot", "claude", "gpt", "premium", "pro"]

        name_lower = name.lower()
        if any(keyword in name_lower for keyword in free_keywords):
            return "Free"
        elif any(keyword in name_lower for keyword in subscription_keywords):
            return "Subscription"
        elif "API" in categories or "Model" in categories:
            return "Usage-based"
        else:
            return "Freemium"

    def generate_supported_platforms(self, name: str, categories: List[str]) -> List[str]:
        """生成支持平台列表"""
        platforms = ["Web"]

        if "IDE Integration" in categories or "Coding" in categories:
            platforms.extend(["VS Code", "JetBrains", "Vim"])
        if "Mobile" in categories or "App" in categories:
            platforms.extend(["iOS", "Android"])
        if "Desktop" in categories:
            platforms.append("Windows")
        if "API" in categories:
            platforms.append("API")

        return list(set(platforms))

    def generate_pricing_details(self, pricing_model: str, name: str) -> str:
        """生成定价详情"""
        pricing_map = {
            "ChatGPT": "免费版 + ChatGPT Plus $20/月",
            "Claude": "免费版 + Claude Pro $20/月",
            "GitHub Copilot": "$10/月个人版，$19/月企业版",
            "Midjourney": "$10/月基础版，$30/月标准版",
            "Stable Diffusion": "免费开源",
            "DALL-E": "按生成次数收费"
        }

        if name in pricing_map:
            return pricing_map[name]

        pricing_templates = {
            "免费": "完全免费使用，无任何限制",
            "Freemium": "基础功能免费，高级功能需要订阅",
            "订阅制": f"月度订阅 ${random.randint(10, 50)}，年度订阅更优惠",
            "一次性付费": f"一次性购买 ${random.randint(20, 200)}，永久使用",
            "按使用量收费": "根据使用量付费，灵活计费"
        }
        return pricing_templates.get(pricing_model, "具体定价请查看官网")

    def generate_seo_content(self, tool_data: Dict) -> Dict:
        """
        使用高质量提示词生成SEO内容

        Args:
            tool_data: 工具基础信息

        Returns:
            SEO内容字典
        """
        if not self.client:
            return self._get_fallback_seo_content(tool_data)

        name = tool_data.get('name', 'Unknown Tool')
        description = tool_data.get('description', '')
        short_description = tool_data.get('short_description', '')
        category = tool_data.get('category', 'AI Tools')
        features = tool_data.get('features', [])
        use_cases = tool_data.get('use_cases', [])

        logger.info(f"Generating premium SEO content for: {name}")

        prompt = f"""你是一位顶尖的SEO内容策略专家和AI产品营销专家。请为以下AI工具创建高质量的SEO优化内容。

工具信息：
- 名称：{name}
- 分类：{category}
- 简短描述：{short_description}
- 详细描述：{description}
- 核心功能：{', '.join(features[:3]) if features else 'AI智能功能'}
- 主要用途：{', '.join(use_cases[:3]) if use_cases else '提高效率和创造力'}

请生成以下SEO内容（严格按照JSON格式返回）：

1. meta_title: SEO标题（50-60字符，包含主要关键词，吸引点击，品牌化）
2. meta_description: SEO描述（150-160字符，包含价值主张、核心功能、行动召唤）
3. description: 详细产品描述（300-400字符，专业、吸引人、包含技术优势）
4. short_description: 简短描述（30-50字符，一句话价值主张）
5. pros: 核心优势列表（4-6条，每条突出独特价值和技术优势）
6. cons: 客观缺点列表（2-4条，真实可接受的局限性）
7. faqs: 常见问题（4-6个，每个包含question和answer，覆盖使用场景、优势、技术细节）

高质量内容要求：
- 使用行业关键词和长尾关键词
- 突出技术创新和实际价值
- 包含数据驱动的表述（如"提高效率80%"）
- 强调用户体验和易用性
- 包含行动召唤（免费试用、立即体验等）

返回格式示例：
{{
  "meta_title": "ChatGPT - 领先AI对话助手 | 智能创作编程学习效率翻倍",
  "meta_description": "体验ChatGPT，OpenAI最先进的AI对话助手。通过自然语言交互，助您高效创作、编程、学习。免费开始，解锁无限创意潜能！",
  "description": "ChatGPT是OpenAI开发的革命性AI对话助手，基于GPT架构提供卓越的自然语言处理能力。它能够理解复杂语境，进行深度对话，生成高质量内容，从代码编写到创意写作全方位助力用户。数百万用户验证：显著提升工作效率，激发创新思维。",
  "short_description": "OpenAI智能对话助手，创作编程学习效率翻倍",
  "pros": [
    "基于GPT-4架构，理解复杂语境和专业术语",
    "多领域知识覆盖，从编程到创意写作全场景适用",
    "自然流畅的对话体验，支持多轮深度交互",
    "免费基础版+专业版选择，满足不同用户需求",
    "持续学习更新，保证内容准确性和时效性",
    "API集成支持，企业级应用开发"
  ],
  "cons": [
    "知识截止到特定日期，对最新事件了解有限",
    "复杂任务可能需要多次迭代优化",
    "高并发使用可能遇到响应延迟",
    "专业领域深度内容需要用户提供准确指导"
  ],
  "faqs": [
    {{
      "question": "ChatGPT适合哪些用户群体？",
      "answer": "ChatGPT适合学生、开发者、内容创作者、市场人员等各类用户。学生可以用它辅助学习，开发者获得编程帮助，创作者激发写作灵感。"
    }}
  ]
}}

请确保内容专业、吸引人、有说服力，严格按照JSON格式返回，不要添加其他解释文字。"""

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )

            content = response.text.strip()

            # 清理可能的代码块包裹
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]

            seo_data = json.loads(content.strip())

            # 验证必需字段
            required_fields = ['meta_title', 'meta_description', 'description', 'short_description', 'pros', 'cons', 'faqs']
            for field in required_fields:
                if field not in seo_data:
                    logger.warning(f"Missing field {field} in generated content for {name}")
                    seo_data[field] = [] if field in ['pros', 'cons', 'faqs'] else ''

            logger.info(f"Successfully generated premium SEO content for: {name}")
            return seo_data

        except Exception as e:
            logger.error(f"Error generating SEO content for {name}: {e}")
            return self._get_fallback_seo_content(tool_data)

    def _get_fallback_seo_content(self, tool_data: Dict) -> Dict:
        """备用SEO内容生成"""
        name = tool_data.get('name', 'Unknown Tool')
        category = tool_data.get('category', 'AI Tools')

        return {
            'meta_title': f"{name} - 专业{category}AI工具 | 效率提升解决方案",
            'meta_description': f"探索{name}，领先的{category}AI工具。提供智能功能，显著提升工作效率。免费试用，体验AI带来的改变。",
            'description': f"{name}是一款专业的{category}AI工具，结合了先进的人工智能技术，为用户提供高质量的服务和解决方案。",
            'short_description': f"专业的{category}AI解决方案",
            'pros': [f"强大的{category}功能", "用户友好界面", "高效处理能力", "持续技术更新"],
            'cons': ["学习曲线可能需要时间", "高级功能需要订阅"],
            'faqs': [{
                "question": f"{name}是什么？",
                "answer": f"{name}是一款专业的{category}AI工具，旨在帮助用户提高效率和创造力。"
            }]
        }

    def generate_complete_tool_data(self, simple_tool: Dict[str, Any]) -> Dict[str, Any]:
        """
        根据 simple_tool 输入，生成完整的 SEO 友好工具数据，包含英文 category 和中文 category_name。

        Args:
            simple_tool: 基础工具数据

        Returns:
            完整的Tool模型数据字典
        """
        name = simple_tool.get('name', '')
        category = simple_tool.get('category', '')
        tags = simple_tool.get('tags', [])
        # categories should include both category and tags
        categories = [category] if category else []
        if tags:
            categories += tags
        link = simple_tool.get('link', '')

        logger.info(f"Generating complete data for: {name}")

        # 确定主要分类（英文标识符）
        category_en = self.determine_primary_category(categories)
        category_zh = self.category_mapping.get(category_en, category_en)

        # 生成定价模式
        pricing_model_en = self.generate_pricing_model(name, categories)
        pricing_model_mapping = {
            "Free": "免费",
            "Freemium": "基础免费，高级付费",
            "Subscription": "订阅制",
            "One-time": "一次性付费",
            "Usage-based": "按使用量收费"
        }
        pricing_model_zh = pricing_model_mapping.get(pricing_model_en, pricing_model_en)

        # 生成基础数据
        # 优先采用 simple_tool 提供的 supported_platforms
        supported_platforms = simple_tool.get('supported_platforms')
        if not supported_platforms:
            supported_platforms = self.generate_supported_platforms(name, categories)

        tool_data = {
            "name": name,
            "official_link": link,
            "category": category_en,  # 英文标识符
            "category_name": category_zh,  # 中文显示名
            "tags": tags,
            "pricing_model": pricing_model_en,  # 英文标识符
            "pricing_model_name": pricing_model_zh,  # 中文显示名
            "supported_platforms": supported_platforms,
            "features": self.generate_tool_features(name, categories, category_en),
            "use_cases": self.generate_use_cases(name, categories, category_en),
            "key_differentiators": self.generate_key_differentiators(name, categories, category_en),
            "pricing_details": self.generate_pricing_details(pricing_model_en, name),
            "rating": round(3.5 + (hash(name) % 15) / 10, 1),  # 3.5-5.0之间的评分
            "is_featured": random.choice([True, False]),
            "logo_url": simple_tool.get('logo_url') if simple_tool.get('logo_url') else f"/static/logos/{name.lower().replace(' ', '-').replace('.', '').replace('/', '')}.png",
            "screenshots": [
                f"/static/screenshots/{name.lower().replace(' ', '-').replace('.', '').replace('/', '')}-1.png",
                f"/static/screenshots/{name.lower().replace(' ', '-').replace('.', '').replace('/', '')}-2.png"
            ],
            "video_url": "",
        }

        # 生成高质量SEO内容
        seo_content = self.generate_seo_content(tool_data)
        tool_data.update(seo_content)

        # 生成关联数据（已移至独立接口，不再预填充）
        tool_data.update({
            # alternatives 和 comparison_data 通过独立API接口动态获取
        })

        return tool_data

    def save_tool_to_json(self, tool_data: Dict, output_file: str = "seo_tools.json"):
        """将工具数据保存到JSON文件"""
        output_path = Path(__file__).parent / output_file

        # 读取现有数据
        existing_tools = []
        if output_path.exists():
            try:
                with open(output_path, 'r', encoding='utf-8') as f:
                    existing_tools = json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                existing_tools = []

        # 检查是否已存在（基于名称）
        existing_names = {tool['name'] for tool in existing_tools}
        if tool_data['name'] in existing_names:
            logger.warning(f"Tool {tool_data['name']} already exists, skipping...")
            return

        # 添加新工具
        existing_tools.append(tool_data)

        # 保存回文件
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(existing_tools, f, ensure_ascii=False, indent=2)

        logger.info(f"Saved tool '{tool_data['name']}' to {output_file} (total: {len(existing_tools)} tools)")

    def generate_all_tools(self, tools: List[Dict], output_file: str = "seo_tools.json", delay: float = 3.0):
        """
        生成所有工具的完整数据

        Args:
            tools: 工具列表
            output_file: 输出文件路径
            delay: API调用间隔（秒）
        """
        logger.info("Starting SEO-friendly tool generation...")

        # 断点续存：读取已生成的工具名称
        output_path = Path(__file__).parent / output_file
        existing_names = set()
        if output_path.exists():
            try:
                with open(output_path, 'r', encoding='utf-8') as f:
                    existing_tools = json.load(f)
                    existing_names = {tool['name'] for tool in existing_tools}
                logger.info(f"Checkpoint resume: {len(existing_names)} tools already generated, will skip.")
            except Exception as e:
                logger.warning(f"Failed to load checkpoint file: {e}")

        processed = 0
        for i, simple_tool in enumerate(tools, 1):
            tool_name = simple_tool.get('name', 'Unknown')
            if tool_name in existing_names:
                logger.info(f"Skipping already generated tool: {tool_name}")
                continue
            logger.info(f"Processing {i}/{len(tools)}: {tool_name}")
            try:
                # --- Logo check: if simple_tool has no logo_url, attempt to fetch from the official link ---
                link = simple_tool.get('link') or simple_tool.get('official_link')
                provided_logo = simple_tool.get('logo_url')
                if (not provided_logo or provided_logo == '') and link:
                    try:
                        fetched_logo = self._fetch_logo_url_from_site(link)
                        if fetched_logo:
                            logger.info(f"Fetched logo for {tool_name}: {fetched_logo}")
                            simple_tool['logo_url'] = fetched_logo
                        else:
                            # ensure field exists and is empty if not found
                            simple_tool['logo_url'] = ''
                    except Exception as e:
                        logger.warning(f"Logo fetch failed for {tool_name} ({link}): {e}")
                        simple_tool['logo_url'] = ''

                complete_tool = self.generate_complete_tool_data(simple_tool)
                self.save_tool_to_json(complete_tool, output_file)
                processed += 1
                if i < len(tools):
                    time.sleep(delay)
            except Exception as e:
                logger.error(f"Failed to generate data for {tool_name}: {e}")
                continue
        logger.info(f"Generation complete! Newly processed {processed} tools (total: {len(existing_names) + processed})")

    def generate_tool_concept(self, category: Optional[str] = None) -> Dict[str, Any]:
        """
        动态生成AI工具概念（英文分类+中文显示名）
        """
        selected_category_en = category or random.choice(self.categories)
        selected_category_zh = self.category_mapping.get(selected_category_en, "AI工具")

        prompt = f"""
你是一位AI产品专家，需要为"{selected_category_zh}"分类创造一个全新的AI工具概念。

请生成一个创新的、有市场潜力的AI工具，包括以下信息：

1. name: 工具名称（英文，简洁有力，包含关键词）
2. description: 详细描述（100-200字，说明功能和价值）
3. short_description: 简短描述（20-50字，一句话介绍）
4. category: 英文分类标识符（使用"{selected_category_en}"）
5. category_name: 中文分类显示名称（使用"{selected_category_zh}"）
6. features: 核心功能列表（3-6个功能点）
7. use_cases: 使用场景列表（3-5个场景）
8. tags: 标签列表（3-6个相关标签）
9. pricing_model: 定价模式（从以下选择：免费、Freemium、订阅制、一次性付费、按使用量收费）
10. supported_platforms: 支持平台列表（从以下选择：Web, iOS, Android, Windows, macOS, Linux, API）

请以JSON格式返回，格式如下：
{{
  "name": "ToolName AI",
  "description": "详细描述...",
  "short_description": "简短描述...",
  "category": "{selected_category_en}",
  "category_name": "{selected_category_zh}",
  "features": ["功能1", "功能2", "功能3"],
  "use_cases": ["场景1", "场景2"],
  "tags": ["标签1", "标签2"],
  "pricing_model": "Freemium",
  "supported_platforms": ["Web", "iOS", "Android"]
}}

确保工具概念是创新的、有实际价值的，不要抄袭现有产品。
"""

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )

            content = response.text.strip()

            # 清理可能的代码块包裹
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]

            tool_concept = json.loads(content.strip())

            # 验证必需字段
            required_fields = ['name', 'description', 'short_description', 'category', 'category_name',
                             'features', 'use_cases', 'tags', 'pricing_model', 'supported_platforms']
            for field in required_fields:
                if field not in tool_concept:
                    logger.warning(f"Missing field {field} in generated concept")
                    tool_concept[field] = [] if field in ['features', 'use_cases', 'tags', 'supported_platforms'] else ''

            # 生成官网链接
            tool_concept['official_link'] = f"https://{tool_concept['name'].lower().replace(' ', '')}.com"

            # 生成评分
            tool_concept['rating'] = round(random.uniform(3.5, 5.0), 1)

            # 确保 category_name 存在且与 category 匹配
            if 'category_name' not in tool_concept or not tool_concept['category_name']:
                tool_concept['category_name'] = self.category_mapping.get(tool_concept.get('category', ''), "AI工具")
            elif tool_concept.get('category') and tool_concept['category_name'] != self.category_mapping.get(tool_concept['category'], ""):
                logger.warning(f"Generated category_name '{tool_concept['category_name']}' does not match mapping for '{tool_concept['category']}'. Using mapped value.")
                tool_concept['category_name'] = self.category_mapping.get(tool_concept['category'], "AI工具")

            logger.info(f"Generated tool concept: {tool_concept['name']} (Category: {tool_concept['category_name']})")
            return tool_concept
        except Exception as e:
            logger.error(f"Error generating tool concept: {e}")
            return self._get_fallback_tool_concept(category)

    def _get_fallback_tool_concept(self, category: Optional[str] = None) -> Dict[str, Any]:
        """备用工具概念生成"""
        selected_category_en = category or random.choice(self.categories)
        selected_category_zh = self.category_mapping.get(selected_category_en, "AI工具")

        return {
            "name": f"{selected_category_en} Tool",
            "description": f"这是一个用于{selected_category_zh}的AI工具，旨在提供卓越的性能和用户体验。",
            "short_description": f"{selected_category_zh} AI工具",
            "category": selected_category_en,
            "category_name": selected_category_zh,
            "features": [f"{selected_category_zh}功能1", f"{selected_category_zh}功能2"],
            "use_cases": [f"适用于{selected_category_zh}的场景1", f"适用于{selected_category_zh}的场景2"],
            "tags": [selected_category_en, "AI", "工具"],
            "pricing_model": "免费",
            "supported_platforms": ["Web"]
        }

    def _fetch_logo_url_from_site(self, link: str) -> Optional[str]:
        """
        尝试使用 `scrapy_logo.py` 中的 Playwright 抓取逻辑获取站点的 logo URL。
        返回高质量格式的 logo URL（如 .png/.jpg/.webp 等），失败返回 None。
        """
        try:
            import asyncio
            import importlib.util
            from pathlib import Path

            script_path = Path(__file__).parent / 'scrapy_logo.py'
            if not script_path.exists():
                logger.warning('scrapy_logo.py not found, skipping logo fetch')
                return None

            spec = importlib.util.spec_from_file_location('scrapy_logo', str(script_path))
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)

            # mod.get_logo_url is async and returns (logo_url, status)
            try:
                logo_result = asyncio.run(mod.get_logo_url(link))
            except RuntimeError:
                # If there's already a running event loop (rare in CLI), create new loop manually
                loop = asyncio.new_event_loop()
                try:
                    asyncio.set_event_loop(loop)
                    logo_result = loop.run_until_complete(mod.get_logo_url(link))
                finally:
                    try:
                        loop.close()
                    except Exception:
                        pass

            if not logo_result:
                return None

            logo_url, status = logo_result
            # Use the same HQ format check from scrapy_logo if available
            is_hq = False
            try:
                is_hq = mod.is_hq_format(logo_url)
            except Exception:
                is_hq = False

            if logo_url and is_hq:
                return logo_url
            return None
        except Exception as e:
            logger.warning(f"_fetch_logo_url_from_site error: {e}")
            return None


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="AI Tools SEO Content Generator")
    parser.add_argument("--input", default="simple_tools.json", help="Input file path")
    parser.add_argument("--output", default="seo_tools.json", help="Output file path")
    parser.add_argument("--delay", type=float, default=3.0, help="API call delay in seconds")
    parser.add_argument("--limit", type=int, help="Limit number of tools to generate (for testing)")

    args = parser.parse_args()

    print("🚀 AI Tools SEO Content Generator")
    print("=" * 50)
    print("Using premium SEO prompts for high-quality content generation")
    print()

    # 检查API密钥
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("⚠️  GOOGLE_API_KEY not found - will use fallback generation")
        print("💡 Set API key for better content: export GOOGLE_API_KEY='your-key'")
        print()

    # 创建生成器
    generator = AIToolsSEOGenerator(api_key=api_key)

    try:
        # 加载基础数据
        simple_tools = generator.load_simple_tools(args.input)

        # 如果设置了limit，只处理前limit个
        if args.limit:
            simple_tools = simple_tools[:args.limit]
            logger.info(f"Limited to first {args.limit} tools for testing")

        # 生成所有工具数据
        generator.generate_all_tools(
            tools=simple_tools,
            output_file=args.output,
            delay=args.delay
        )

        print("\n✅ Generation complete!")
        print(f"📁 Output saved to: {args.output}")
        print("🎯 Generated SEO-friendly content with premium prompts")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())