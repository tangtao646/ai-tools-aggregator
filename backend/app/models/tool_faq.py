# backend/app/models/tool_faq.py (新文件)

from typing import Optional,TYPE_CHECKING
from sqlmodel import Field, SQLModel, Relationship,Column,Integer, ForeignKey
if TYPE_CHECKING:
   from .tool import Tool
   

class ToolFAQBase(SQLModel):
    lang_code: str = Field(index=True, nullable=False) # 语言代码
    faq_order: int = Field(nullable=False)             # 排序字段
    question: str = Field(nullable=False)
    answer: str = Field(nullable=False)


class ToolFAQ(ToolFAQBase, table=True):
    __tablename__ = "tool_faqs"
    id: Optional[int] = Field(default=None, primary_key=True)

    # 外键
    tool_id: int = Field(sa_column=Column(
            Integer, 
            ForeignKey("tools.id", ondelete="CASCADE"), # 确保删除 tools 记录时，关联的翻译记录自动删除
             index=True,
        )
    )

    # 定义关系
    tool: "Tool" = Relationship(back_populates="faqs")
  