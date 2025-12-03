# backend/app/models/FormTool.py
from typing import Optional, List
from pydantic import BaseModel, ConfigDict 

# 提交页面模型 (不存入数据库)
class FormTool(BaseModel):
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