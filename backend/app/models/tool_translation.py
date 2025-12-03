# backend/app/models/tool_translation.py 

from typing import Optional, List,TYPE_CHECKING
from sqlmodel import Field, SQLModel, Column, JSON, Relationship,Integer, ForeignKey
if TYPE_CHECKING:
   from .tool import Tool

class ToolTranslationBase(SQLModel):
    lang_code: str = Field(index=True, nullable=False) # 语言代码 (如 'zh', 'en')
    
    # --- 原 ToolBase 中的可翻译字段 ---
    description: str
    short_description: str 
    category_name: str = Field(index=True) # 分类显示名称
    
    # 详细信息字段 (翻译后的列表)
    features: List[str] = Field(default=[], sa_column=Column(JSON))
    use_cases: List[str] = Field(default=[], sa_column=Column(JSON))
    key_differentiators: List[str] = Field(default=[], sa_column=Column(JSON))
    pricing_details: Optional[str] = Field(default=None)
    
    # SEO 优化字段
    meta_title: Optional[str] = Field(default=None, max_length=60)
    meta_description: Optional[str] = Field(default=None, max_length=160)
    
    # P1 战略蓝图字段
    pros: List[str] = Field(default=[], sa_column=Column(JSON))
    cons: List[str] = Field(default=[], sa_column=Column(JSON))


class ToolTranslation(ToolTranslationBase, table=True):
    __tablename__ = "tool_translations"
    id: Optional[int] = Field(default=None, primary_key=True)

    # 外键：关联到核心 Tool 表
    tool_id: int = Field(sa_column=Column(
            Integer, 
            ForeignKey("tools.id", ondelete="CASCADE"), # 确保删除 tools 记录时，关联的翻译记录自动删除
            index=True, 
        )
    )

    # 定义关系
    tool: "Tool" = Relationship(back_populates="translations")
    
    
   