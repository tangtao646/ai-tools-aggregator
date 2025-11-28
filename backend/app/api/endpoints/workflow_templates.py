from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from typing import List, Optional

from app.core.db import get_session
from app.core.auth import get_current_user, get_current_admin
from app.models.workflow_template import WorkflowTemplate, WorkflowNode, WorkflowTemplateCategory
from app.models.user import User
from app.schemas.workflow_template import (
    WorkflowTemplateCreate, WorkflowTemplateRead, WorkflowTemplateUpdate,
    WorkflowNodeCreate, WorkflowNodeRead
)

router = APIRouter()

# 获取模板列表（支持分页和分类筛选）
@router.get("/workflow-templates", response_model=List[WorkflowTemplateRead])
def list_templates(
    category: Optional[WorkflowTemplateCategory] = Query(None),
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_session)
):
    query = select(WorkflowTemplate)
    if category:
        query = query.where(WorkflowTemplate.category == category)
    query = query.offset(skip).limit(limit)
    templates = db.exec(query).all()
    return templates

# 获取模板详情
@router.get("/workflow-templates/{template_id}", response_model=WorkflowTemplateRead)
def get_template(template_id: int, db: Session = Depends(get_session)):
    template = db.get(WorkflowTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

# 创建新模板（需登录）
@router.post("/workflow-templates", response_model=WorkflowTemplateRead)
def create_template(
    template_in: WorkflowTemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    template = WorkflowTemplate(
        title=template_in.title,
        description=template_in.description,
        category=template_in.category,
        flow_chart_description=template_in.flow_chart_description,
        creator_id=current_user.id,
        status="pending"
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    # 创建流程节点
    for idx, node_in in enumerate(template_in.nodes):
        node = WorkflowNode(
            template_id=template.id,
            order=idx + 1,
            tool_name=node_in.tool_name,
            description=node_in.description,
            prompt_template=node_in.prompt_template
        )
        db.add(node)
    db.commit()
    db.refresh(template)
    return template

# 更新模板（需登录且为创建者或管理员）
@router.put("/workflow-templates/{template_id}", response_model=WorkflowTemplateRead)
def update_template(
    template_id: int,
    template_in: WorkflowTemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
):
    template = db.get(WorkflowTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if template.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="No permission to update this template")
    for field, value in template_in.dict(exclude_unset=True).items():
        setattr(template, field, value)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

# 删除模板（需管理员）
@router.delete("/workflow-templates/{template_id}", status_code=204)
def delete_template(
    template_id: int,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_session)
):
    template = db.get(WorkflowTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return

# 审核模板（管理员）
@router.post("/workflow-templates/{template_id}/review", response_model=WorkflowTemplateRead)
def review_template(
    template_id: int,
    status: str = Query(..., regex="^(approved|rejected)$"),
    admin=Depends(get_current_admin),
    db: Session = Depends(get_session)
):
    template = db.get(WorkflowTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    template.status = status
    db.add(template)
    db.commit()
    db.refresh(template)
    return template
