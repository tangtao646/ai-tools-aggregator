from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class AdminBase(SQLModel):
    """管理员基础模型"""
    username: str = Field(unique=True, index=True, max_length=50)


class Admin(AdminBase, table=True):
    """管理员数据库模型"""
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.now)


class AdminCreate(AdminBase):
    """创建管理员时的请求模型"""
    password: str


class AdminLogin(SQLModel):
    """管理员登录请求模型"""
    username: str
    password: str


class AdminResponse(AdminBase):
    """管理员响应模型（不包含密码）"""
    id: int
    created_at: datetime
