# backend/app/utils/slug.py
import re
import unicodedata
from sqlmodel import Session, select
from typing import Optional

def generate_slug(text: str) -> str:
    """
    将文本转换为 SEO 友好的 slug
    例如: "ChatGPT AI Assistant" -> "chatgpt-ai-assistant"
    """
    # 转换为小写
    text = text.lower()
    
    # 移除重音符号 (例如: é -> e)
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    
    # 替换空格和特殊字符为连字符
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    
    # 移除首尾的连字符
    text = text.strip('-')
    
    return text


def generate_unique_slug(session: Session, model, text: str, instance_id: Optional[int] = None) -> str:
    """
    生成唯一的 slug（如果重复则添加数字后缀）
    
    Args:
        session: 数据库会话
        model: 数据模型类 (例如 Tool)
        text: 要转换的文本
        instance_id: 当前实例的 ID (更新时使用，避免与自己冲突)
    
    Returns:
        唯一的 slug
    """
    base_slug = generate_slug(text)
    slug = base_slug
    counter = 1
    
    while True:
        # 检查 slug 是否已存在
        statement = select(model).where(model.slug == slug)
        
        # 如果是更新操作，排除当前实例
        if instance_id is not None:
            statement = statement.where(model.id != instance_id)
        
        existing = session.exec(statement).first()
        
        if not existing:
            return slug
        
        # 如果存在，添加数字后缀
        slug = f"{base_slug}-{counter}"
        counter += 1
