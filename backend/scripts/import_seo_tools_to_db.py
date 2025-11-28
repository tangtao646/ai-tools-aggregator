#!/usr/bin/env python3
"""
将 seo_tools.json 的内容批量写入 tools 数据库表
"""
import os
import json
from pathlib import Path
import sys
import traceback

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent.parent))

from app.core.db import get_session
# Ensure User model is imported first so the users table is registered
from app.models.user import User
from app.models.tool import Tool, ReviewStatus
from app.utils.slug import generate_unique_slug

def main():
    input_path = Path(__file__).parent / "seo_tools.json"
    if not input_path.exists():
        print(f"❌ 未找到文件: {input_path}")
        return 1

    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            tools_data = json.load(f)

        from app.core.db import engine
        from sqlmodel import Session
        def ensure_list(val):
            return val if isinstance(val, list) else []
        def ensure_dict_list(val):
            return val if isinstance(val, list) and all(isinstance(i, dict) for i in val) else []
        with Session(engine) as session:
            inserted = 0
            for tool in tools_data:
                exists = session.query(Tool).filter_by(name=tool['name']).first()
                if exists:
                    print(f"跳过已存在: {tool['name']}")
                    continue
                db_tool = Tool(
                    name=tool.get('name', ''),
                    official_link=tool.get('official_link', ''),
                    category=tool.get('category', ''),
                    category_name=tool.get('category_name', ''),
                    tags=ensure_list(tool.get('tags', [])),
                    pricing_model=tool.get('pricing_model', ''),
                    pricing_model_name=tool.get('pricing_model_name', ''),
                    supported_platforms=ensure_list(tool.get('supported_platforms', [])),
                    features=ensure_list(tool.get('features', [])),
                    use_cases=ensure_list(tool.get('use_cases', [])),
                    key_differentiators=ensure_list(tool.get('key_differentiators', [])),
                    pricing_details=tool.get('pricing_details', ''),
                    rating=tool.get('rating', 0),
                    is_featured=tool.get('is_featured', False),
                    logo_url=tool.get('logo_url', ''),
                    screenshots=ensure_list(tool.get('screenshots', [])),
                    video_url=tool.get('video_url', ''),
                    meta_title=tool.get('meta_title', ''),
                    meta_description=tool.get('meta_description', ''),
                    description=tool.get('description', ''),
                    short_description=tool.get('short_description', ''),
                    pros=ensure_list(tool.get('pros', [])),
                    cons=ensure_list(tool.get('cons', [])),
                    faqs=ensure_dict_list(tool.get('faqs', [])),
                    review_status=str(tool.get('review_status', 'PUBLISHED'))
                )
                # 生成唯一 slug（数据库可能对 slug 设置为 NOT NULL）
                if not getattr(db_tool, 'slug', None):
                    db_tool.slug = generate_unique_slug(session, Tool, db_tool.name)

                session.add(db_tool)
                inserted += 1
            session.commit()
            print(f"✅ 已插入 {inserted} 条工具数据到数据库 tools 表")
        return 0
    except Exception as e:
        print("❌ 导入失败，错误信息如下：")
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    exit(main())
