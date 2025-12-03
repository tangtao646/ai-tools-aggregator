from typing import Optional, TYPE_CHECKING
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship

# 导入新的翻译模型，用于定义关系
if TYPE_CHECKING:
  from .category_translations import CategoryTranslation

class CategoryBase(SQLModel):
    """核心类别模型基类，只包含不可翻译字段。"""
    original_category: str = Field(index=True, nullable=False, unique=True) # 保持唯一性


class Category(CategoryBase, table=True):
    """对应数据库中的 categories 表 (原 CategoryMapping 的核心部分)。"""
    __tablename__ = 'categories' # 明确指定新表名
    
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # 定义与翻译表的关系 (1:N)
    translations: list["CategoryTranslation"] = Relationship(back_populates="category")