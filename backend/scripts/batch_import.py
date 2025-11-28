#!/usr/bin/env python3
"""
Batch Import Script for AI Tools
功能：批量导入工具数据到数据库
支持格式：JSON, CSV
支持来源：
- 爬虫抓取的 JSON 文件
- LLM 生成内容后的 JSON 文件
- 手动编辑的 CSV 文件
"""

import sys
import os
import json
import csv
from pathlib import Path
from typing import List, Dict, Optional
import logging
from datetime import datetime

# 添加父目录到路径，以便导入 app 模块
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models.tool import Tool, ReviewStatus
from app.models.user import User  # 导入 User 模型以建立外键关系
from app.utils.slug import generate_unique_slug

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BatchImporter:
    """批量导入工具"""
    
    def __init__(self, auto_approve: bool = False):
        """
        初始化导入器
        
        Args:
            auto_approve: 是否自动审核通过（True 为 PUBLISHED，False 为 PENDING）
        """
        self.auto_approve = auto_approve
        self.default_status = ReviewStatus.PUBLISHED if auto_approve else ReviewStatus.PENDING
    
    def load_json(self, filepath: str) -> List[Dict]:
        """
        从 JSON 文件加载数据
        
        Args:
            filepath: JSON 文件路径
            
        Returns:
            工具数据列表
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 处理两种格式：直接列表 或 {"tools": [...]}
            if isinstance(data, list):
                tools = data
            elif isinstance(data, dict) and 'tools' in data:
                tools = data['tools']
            else:
                raise ValueError("Invalid JSON format. Expected a list or {'tools': [...]}")
            
            logger.info(f"Loaded {len(tools)} tools from {filepath}")
            return tools
        except Exception as e:
            logger.error(f"Failed to load JSON file: {e}")
            raise
    
    def load_csv(self, filepath: str) -> List[Dict]:
        """
        从 CSV 文件加载数据
        
        Args:
            filepath: CSV 文件路径
            
        Returns:
            工具数据列表
        """
        try:
            tools = []
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # 处理 JSON 字段（tags, features, pros, cons, faqs, screenshots）
                    for json_field in ['tags', 'features', 'use_cases', 'pros', 'cons', 'faqs', 'screenshots']:
                        if json_field in row and row[json_field]:
                            try:
                                row[json_field] = json.loads(row[json_field])
                            except json.JSONDecodeError:
                                # 简单的逗号分隔处理
                                row[json_field] = [item.strip() for item in row[json_field].split(',')]
                    
                    # 处理布尔字段
                    if 'is_featured' in row:
                        row['is_featured'] = row['is_featured'].lower() in ['true', '1', 'yes']
                    
                    # 处理数字字段
                    if 'rating' in row and row['rating']:
                        try:
                            row['rating'] = float(row['rating'])
                        except ValueError:
                            row['rating'] = None
                    
                    tools.append(row)
            
            logger.info(f"Loaded {len(tools)} tools from {filepath}")
            return tools
        except Exception as e:
            logger.error(f"Failed to load CSV file: {e}")
            raise
    
    def import_tools(self, tools_data: List[Dict], skip_duplicates: bool = True) -> Dict[str, int]:
        """
        导入工具到数据库
        
        Args:
            tools_data: 工具数据列表
            skip_duplicates: 是否跳过已存在的工具（根据 name 判断）
            
        Returns:
            统计信息字典 {"success": N, "skipped": M, "failed": K}
        """
        stats = {"success": 0, "skipped": 0, "failed": 0}
        
        with Session(engine) as session:
            for i, tool_data in enumerate(tools_data, 1):
                try:
                    name = tool_data.get('name')
                    if not name:
                        logger.warning(f"Skipping tool {i}: missing name")
                        stats["failed"] += 1
                        continue
                    
                    # 检查是否已存在
                    if skip_duplicates:
                        existing = session.exec(
                            select(Tool).where(Tool.name == name)
                        ).first()
                        
                        if existing:
                            logger.info(f"Skipping {i}/{len(tools_data)}: {name} (already exists)")
                            stats["skipped"] += 1
                            continue
                    
                    # 生成 slug
                    slug = generate_unique_slug(session, Tool, name, None)
                    
                    # 自动生成 meta_title 和 meta_description（如果未提供）
                    meta_title = tool_data.get('meta_title') or f"{name} - AI Tool Review & Guide"
                    meta_description = tool_data.get('meta_description') or (
                        tool_data.get('description', '')[:160] if tool_data.get('description') else f"Discover {name}"
                    )
                    
                    # 创建工具对象
                    tool = Tool(
                        name=name,
                        slug=slug,
                        description=tool_data.get('description', ''),
                        short_description=tool_data.get('short_description'),
                        official_link=tool_data.get('official_link', ''),
                        category=tool_data.get('category', 'AI Tools'),
                        pricing_model=tool_data.get('pricing_model', 'Unknown'),
                        logo_url=tool_data.get('logo_url'),
                        tags=tool_data.get('tags', []),
                        features=tool_data.get('features'),
                        use_cases=tool_data.get('use_cases'),
                        pricing_details=tool_data.get('pricing_details'),
                        is_featured=tool_data.get('is_featured', False),
                        review_status=tool_data.get('review_status', self.default_status),
                        
                        # SEO 字段
                        meta_title=meta_title[:60],
                        meta_description=meta_description[:160],
                        pros=tool_data.get('pros', []),
                        cons=tool_data.get('cons', []),
                        faqs=tool_data.get('faqs', []),
                        rating=tool_data.get('rating'),
                        screenshots=tool_data.get('screenshots', []),
                        video_url=tool_data.get('video_url'),
                    )
                    
                    session.add(tool)
                    session.commit()
                    session.refresh(tool)
                    
                    logger.info(f"✓ Imported {i}/{len(tools_data)}: {name} (ID: {tool.id})")
                    stats["success"] += 1
                    
                except Exception as e:
                    logger.error(f"✗ Failed to import tool {i}/{len(tools_data)}: {e}")
                    stats["failed"] += 1
                    session.rollback()
                    continue
        
        return stats
    
    def print_stats(self, stats: Dict[str, int]):
        """打印导入统计"""
        print("\n" + "="*50)
        print("IMPORT STATISTICS")
        print("="*50)
        print(f"✓ Successfully imported: {stats['success']}")
        print(f"⊘ Skipped (duplicates):  {stats['skipped']}")
        print(f"✗ Failed:                {stats['failed']}")
        print(f"Total processed:         {sum(stats.values())}")
        print("="*50 + "\n")


def main():
    """主函数 - 命令行接口"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Batch import AI tools from JSON or CSV files"
    )
    parser.add_argument(
        'filepath',
        help="Path to JSON or CSV file containing tools data"
    )
    parser.add_argument(
        '--auto-approve',
        action='store_true',
        help="Automatically approve tools (set status to PUBLISHED)"
    )
    parser.add_argument(
        '--allow-duplicates',
        action='store_true',
        help="Allow importing duplicate tools (by name)"
    )
    parser.add_argument(
        '--format',
        choices=['json', 'csv'],
        help="File format (auto-detected if not specified)"
    )
    
    args = parser.parse_args()
    
    # 检查文件是否存在
    if not os.path.exists(args.filepath):
        print(f"Error: File not found: {args.filepath}")
        sys.exit(1)
    
    # 自动检测文件格式
    file_format = args.format
    if not file_format:
        ext = Path(args.filepath).suffix.lower()
        if ext == '.json':
            file_format = 'json'
        elif ext == '.csv':
            file_format = 'csv'
        else:
            print(f"Error: Cannot detect file format from extension: {ext}")
            print("Please specify --format json or --format csv")
            sys.exit(1)
    
    print(f"\n📥 Starting batch import from {args.filepath}")
    print(f"Format: {file_format.upper()}")
    print(f"Auto-approve: {'Yes' if args.auto_approve else 'No'}")
    print(f"Skip duplicates: {'Yes' if not args.allow_duplicates else 'No'}\n")
    
    # 创建导入器
    importer = BatchImporter(auto_approve=args.auto_approve)
    
    # 加载数据
    if file_format == 'json':
        tools_data = importer.load_json(args.filepath)
    else:
        tools_data = importer.load_csv(args.filepath)
    
    # 执行导入
    stats = importer.import_tools(
        tools_data,
        skip_duplicates=not args.allow_duplicates
    )
    
    # 打印统计
    importer.print_stats(stats)


if __name__ == "__main__":
    main()
