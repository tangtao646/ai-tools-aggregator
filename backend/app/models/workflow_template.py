from typing import List, Optional
from datetime import datetime

from sqlmodel import Field, SQLModel, Relationship, Enum
import enum

# 定义工作流模板的分类枚举
class WorkflowTemplateCategory(str, enum.Enum):
    IMAGE_GENERATOR = "图片生成"
    TEXT_GENERATOR = "文本生成"
    VIDEO_EDITOR = "视频编辑"
    AUDIO_PROCESSOR = "音频处理"
    MARKETING = "市场营销"
    PRODUCTIVITY = "效率工具"
    DEVELOPMENT = "开发辅助"
    OTHER = "其他"

# 定义流程节点模型
class WorkflowNode(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    template_id: Optional[int] = Field(default=None, foreign_key="workflowtemplate.id")
    
    order: int = Field(index=True) # 节点顺序
    tool_name: str # 使用的AI工具名称，例如 "GPT-4", "Midjourney"
    description: str # 节点描述，例如 "文案生成", "图片生成"
    prompt_template: str # 对应的Prompt模板

    template: Optional["WorkflowTemplate"] = Relationship(back_populates="nodes") # 新增：反向关系定义

# 定义工作流模板模型
class WorkflowTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    description: str
    category: WorkflowTemplateCategory = Field(default=WorkflowTemplateCategory.OTHER, index=True)
    flow_chart_description: str # 流程图的文字描述
    
    # 审核状态
    status: str = Field(default="pending", index=True) # pending, approved, rejected
    
    # 创建者信息 (关联到User模型)
    creator_id: Optional[int] = Field(default=None, foreign_key="users.id")
    
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # 关系：一个模板有多个流程节点
    nodes: List["WorkflowNode"] = Relationship(back_populates="template")

