import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import random
from datetime import datetime
from sqlmodel import Session
from app.core.db import engine
from app.models.workflow_template import WorkflowTemplate, WorkflowNode, WorkflowTemplateCategory
from app.models.user import User

TITLES = [
    "AI社媒营销自动化",
    "智能图片生成流程",
    "自动化内容写作",
    "视频剪辑AI流水线",
    "音频转文字工作流",
    "AI产品调研助手",
    "自动化招聘筛选",
    "智能客服问答",
    "AI代码生成",
    "自动化数据分析"
]

DESCS = [
    "串联多款AI工具，实现一键社媒内容生成和发布。",
    "从文案到图片，自动生成高质量视觉内容。",
    "AI驱动的内容写作与优化流程。",
    "视频自动剪辑、配音与发布全流程。",
    "音频自动转录并生成摘要。",
    "AI辅助产品调研与竞品分析。",
    "自动筛选简历并生成面试问题。",
    "智能客服自动应答与工单分流。",
    "AI自动生成代码并测试。",
    "数据自动采集、清洗与分析。"
]

TOOLS = [
    "GPT-4", "Midjourney", "Zapier", "Notion AI", "Whisper", "DALL-E", "Make.com", "Stable Diffusion", "Google Sheets", "PaddleSpeech"
]

PROMPTS = [
    "请生成一段适合社交媒体的推广文案。",
    "根据文案生成一张吸引人的图片。",
    "自动发布内容到指定平台。",
    "将音频内容转为文字摘要。",
    "生成一份竞品分析报告。",
    "筛选出最优简历并生成面试问题。",
    "自动回复客户常见问题。",
    "生成Python代码并进行单元测试。",
    "采集并清洗指定网站的数据。",
    "分析数据并生成可视化图表。"
]

CATEGORIES = list(WorkflowTemplateCategory)

with Session(engine) as session:
    for i in range(10):
        template = WorkflowTemplate(
            title=TITLES[i],
            description=DESCS[i],
            category=random.choice(CATEGORIES),
            flow_chart_description=f"流程图：{TITLES[i]}，共3步。",
            creator_id=1,  # 假设有一个用户ID为1
            status="approved",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(template)
        session.commit()
        session.refresh(template)
        # 添加3个节点
        for j in range(3):
            node = WorkflowNode(
                template_id=template.id,
                order=j+1,
                tool_name=random.choice(TOOLS),
                description=f"步骤{j+1}：{PROMPTS[j]}",
                prompt_template=PROMPTS[j]
            )
            session.add(node)
        session.commit()
    print("已生成10条工作流测试数据。")
