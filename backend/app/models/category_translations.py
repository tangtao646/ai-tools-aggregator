from typing import Optional
from sqlmodel import Field, SQLModel, Relationship
from .category import Category

class CategoryTranslationBase(SQLModel):
    """类别翻译模型基类。"""
    lang_code: str = Field(index=True, nullable=False) # 语言代码 ('zh', 'en')
    display_category: str = Field(nullable=False)      # 翻译后的显示名称


class CategoryTranslation(CategoryTranslationBase, table=True):
    """对应数据库中的 category_translations 表。"""
    __tablename__ = 'category_translations' # 明确指定新表名
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # 外键：关联到核心类别表
    category_id: int = Field(foreign_key="categories.id", index=True, nullable=False)
    
    # 定义与核心表的关系 (N:1)
    category: Category = Relationship(back_populates="translations")
    
    # 确保同一个 category_id 和 lang_code 组合是唯一的 (对应数据库的 UniqueConstraint)
    # ⚠️ 确保在您的数据库层或 SQLModel 声明中也实现 UniqueConstraint