# backend/app/models/tool.py
from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship, Column, JSON
from datetime import datetime
from enum import Enum
from pydantic import ConfigDict

# 审核状态枚举
class ReviewStatus(str, Enum):
    PENDING = "PENDING"                        # 待审核（用户刚提交）
    APPROVED_PENDING_SEO = "APPROVED_PENDING_SEO"  # 内容审核通过，等待生成SEO
    SEO_GENERATED = "SEO_GENERATED"            # SEO已生成，待管理员审核
    PUBLISHED = "PUBLISHED"                    # 最终发布
    REJECTED = "REJECTED"                      # 已拒绝

# --- 1. 基础模型 (数据库表结构) ---
class ToolBase(SQLModel):
    name: str = Field(index=True)
    slug: Optional[str] = Field(default=None, unique=True, index=True)  # SEO 友好的 URL (如 "chatgpt-ai-assistant")，可选，后端自动生成
    description: str
    short_description: str # 简短描述（一句话）- 必填
    official_link: str
    category: str = Field(index=True) # 英文分类标识符，如 'Image Generation', 'Writing'
    category_name: str = Field(index=True) # 分类显示名称，如 '图像生成', '写作' (用于多语言展示)
    pricing_model: str = Field(default="") # 如 'Free', 'Subscription'
    is_featured: bool = Field(default=False) # 是否推荐/置顶
    
    # 基础展示字段
    tags: List[str] = Field(default=[], sa_column=Column(JSON)) # 标签列表，如 ['API', 'Productivity']
    logo_url: Optional[str] = Field(default=None) # Logo图片URL
    
    # 审核管理字段
    review_status: str = Field(default=ReviewStatus.PENDING, index=True) # 审核状态: PENDING/PUBLISHED/REJECTED
    rejection_reason: Optional[str] = Field(default=None) # 拒绝原因（仅当 review_status=REJECTED 时有值）
    submitter_id: Optional[int] = Field(default=None, index=True, foreign_key="users.id") # 提交者用户ID
    submitter_email: Optional[str] = Field(default=None, index=True) # 提交者邮箱（备用，兼容旧数据）
    edit_count: int = Field(default=0) # 修改次数（用于限制重复修改）
    
    # 详细信息字段
    features: Optional[List[str]] = Field(default=None, sa_column=Column(JSON)) # 功能列表
    use_cases: Optional[List[str]] = Field(default=None, sa_column=Column(JSON)) # 使用场景列表
    key_differentiators: Optional[List[str]] = Field(default=None, sa_column=Column(JSON)) # 关键差异化特性
    pricing_details: Optional[str] = Field(default=None) # 定价详情文本
    
    # SEO 优化字段
    meta_title: Optional[str] = Field(default=None, max_length=60)  # 自定义 SEO 标题 (推荐 50-60 字符)
    meta_description: Optional[str] = Field(default=None, max_length=160)  # 自定义 SEO 描述 (推荐 150-160 字符)
    
    # P1 战略蓝图字段 - 内容增强
    pros: Optional[List[str]] = Field(default=None, sa_column=Column(JSON)) # 优点列表
    cons: Optional[List[str]] = Field(default=None, sa_column=Column(JSON)) # 缺点列表
    faqs: Optional[List[dict]] = Field(default=None, sa_column=Column(JSON)) # FAQ 数据 [{"question": "...", "answer": "..."}]
    rating: Optional[float] = Field(default=None) # 平均评分 (0-5)
    screenshots: Optional[List[str]] = Field(default=None, sa_column=Column(JSON)) # 截图 URL 列表
    video_url: Optional[str] = Field(default=None) # 介绍视频链接

    # 新增字段：支持平台、对比数据、替代工具
    supported_platforms: Optional[List[str]] = Field(default_factory=list, sa_column=Column(JSON)) # 支持平台列表，如 ['Web', 'iOS', 'Android']
    # 注意：alternatives 和 comparison_data 已移至独立接口，不再存储在Tool模型中

    # 数据库自动管理字段
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

class Tool(ToolBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # 关系字段 (如果未来实现评论功能)
    # comments: List["Comment"] = Relationship(back_populates="tool") 

# --- 2. Pydantic Schemas (用于 API 输入/输出) ---
# ToolCreate: 用户提交新工具时需要提供的字段 (不包含 ID, created_at 等)
class ToolCreate(ToolBase):
    pass

# ToolRead: 返回给前端的工具详情 (包含所有字段)
class ToolRead(ToolBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
    
    # 确保 JSON 字段被正确解析
    supported_platforms: Optional[List[str]] = None
    # 注意：alternatives 和 comparison_data 通过独立接口获取
    
# ToolUpdate: 更新工具时使用的字段 (所有字段都可选)
class ToolUpdate(SQLModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    official_link: Optional[str] = None
    category: Optional[str] = None
    category_name: Optional[str] = None
    pricing_model: Optional[str] = None
    is_featured: Optional[bool] = None
    tags: Optional[List[str]] = None
    logo_url: Optional[str] = None
    review_status: Optional[str] = None
    rejection_reason: Optional[str] = None
    submitter_id: Optional[int] = None
    submitter_email: Optional[str] = None
    edit_count: Optional[int] = None
    features: Optional[List[str]] = None
    use_cases: Optional[List[str]] = None
    key_differentiators: Optional[List[str]] = None
    pricing_details: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    pros: Optional[List[str]] = None
    cons: Optional[List[str]] = None
    faqs: Optional[List[dict]] = None
    rating: Optional[float] = None
    screenshots: Optional[List[str]] = None
    video_url: Optional[str] = None
    supported_platforms: Optional[List[str]] = None
    # 注意：alternatives 和 comparison_data 不支持直接更新，通过独立接口管理
