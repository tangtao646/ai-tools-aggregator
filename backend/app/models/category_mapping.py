from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel


class CategoryMappingBase(SQLModel):
    """Base model for category mapping entries."""
    original_category: str = Field(index=True, nullable=False)
    display_category: str = Field(nullable=False)


class CategoryMapping(CategoryMappingBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CategoryMappingCreate(CategoryMappingBase):
    pass


class CategoryMappingRead(CategoryMappingBase):
    id: int
