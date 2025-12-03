# backend/app/models/tool.py
from typing import Optional, List,TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship, Column, JSON
from datetime import datetime
from enum import Enum
from pydantic import ConfigDict
if TYPE_CHECKING:
   from .tool_translation import ToolTranslation
   from .tool_faq import ToolFAQ

# 审核状态枚举
class ReviewStatus(str, Enum):
    PENDING = "PENDING"                        # 待审核（用户刚提交）
    APPROVED_PENDING_SEO = "APPROVED_PENDING_SEO"  # 内容审核通过，等待生成SEO
    SEO_GENERATED = "SEO_GENERATED"            # SEO已生成，待管理员审核
    PUBLISHED = "PUBLISHED"                    # 最终发布
    REJECTED = "REJECTED"                      # 已拒绝

# --- 核心模型 (对应 tools 表) ---
class ToolBase(SQLModel):
    # 唯一性/结构性字段 (不可翻译)
    name: str = Field(index=True) # 英文/原始名称 (或通用名称)
    slug: Optional[str] = Field(default=None, unique=True, index=True)
    official_link: str
    category: str = Field(index=True) # 英文分类标识符
    pricing_model: str = Field(default="") # 如 'Free', 'Subscription'
    is_featured: bool = Field(default=False)
    
    # 基础展示字段 (不可翻译)
    tags: List[str] = Field(default=[], sa_column=Column(JSON))
    logo_url: Optional[str] = Field(default=None)
    rating: Optional[float] = Field(default=None)
    screenshots: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    video_url: Optional[str] = Field(default=None)
    supported_platforms: List[str] = Field(default_factory=list, sa_column=Column(JSON))

    # 审核管理字段 (保留不变)
    review_status: str = Field(default=ReviewStatus.PENDING, index=True)
    rejection_reason: Optional[str] = Field(default=None)
    submitter_id: Optional[int] = Field(default=None, index=True, foreign_key="users.id")
    submitter_email: Optional[str] = Field(default=None, index=True)
    edit_count: int = Field(default=0)
    
    # 数据库自动管理字段 (保留不变)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class Tool(ToolBase, table=True):
    __tablename__ = "tools" 
    id: Optional[int] = Field(default=None, primary_key=True)

    # 关系字段
    # 关联到 ToolTranslation (一对多)
    translations: List["ToolTranslation"] = Relationship(
        back_populates="tool",
        # 增加级联删除配置
        sa_relationship_kwargs={"cascade": "all, delete-orphan"} 
    )
    
    # 关联到 ToolFAQ (一对多)
    faqs: List["ToolFAQ"] = Relationship(
        back_populates="tool",
        # 增加级联删除配置
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )