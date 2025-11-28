from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.models.workflow_template import WorkflowTemplateCategory # 导入分类枚举
from app.api.endpoints import workflow_templates
from app.core.config import settings

# --- WorkflowNode Schemas ---
class WorkflowNodeBase(BaseModel):
    order: int
    tool_name: str
    description: str
    prompt_template: str

class WorkflowNodeCreate(WorkflowNodeBase):
    pass

class WorkflowNodeRead(WorkflowNodeBase):
    id: int
    template_id: int

    class Config:
        orm_mode = True

# --- WorkflowTemplate Schemas ---
class WorkflowTemplateBase(BaseModel):
    title: str
    description: str
    category: WorkflowTemplateCategory
    flow_chart_description: str
    status: Optional[str] = "pending" # 默认状态为 pending

class WorkflowTemplateCreate(WorkflowTemplateBase):
    nodes: List[WorkflowNodeCreate] # 创建时包含节点列表

class WorkflowTemplateUpdate(WorkflowTemplateBase):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[WorkflowTemplateCategory] = None
    flow_chart_description: Optional[str] = None
    status: Optional[str] = None
    nodes: Optional[List[WorkflowNodeCreate]] = None # 更新时可选择更新节点

class WorkflowTemplateRead(WorkflowTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime
    creator_id: Optional[int]
    nodes: List[WorkflowNodeRead] = [] # 读取时包含节点列表

    class Config:
        orm_mode = True

