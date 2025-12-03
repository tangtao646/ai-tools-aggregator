# backend/scripts/import_tools_auto_split.py
import json
import os
import sys
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
# 导入 datetime 和 timezone
from datetime import datetime, timezone
import logging # 导入 logging 模块

# 只导入必需的 SQLModel/SQLAlchemy 工具
from sqlmodel import Session, select
from sqlalchemy.dialects.postgresql import JSON # 保持 JSON 导入

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent.parent))

# 现在可以从项目根目录开始正确导入 app 内部的模块
from app.core.db import engine 
from app.utils.slug import generate_unique_slug
from app.models.tool import Tool 
from app.models.tool_translation import ToolTranslation
from app.models.tool_faq import ToolFAQ
from app.models.tool import ReviewStatus 


# --- 1. 核心工具函数和常量 ---

# 常见的数据库字段长度限制 (基于之前对话的推测)
MAX_LEN_SLUG = 60
MAX_LEN_CATEGORY = 60
MAX_LEN_NAME = 255 
MAX_LEN_LINK = 255
MAX_LEN_META_TITLE = 60
MAX_LEN_META_DESC = 160
MAX_LEN_SHORT_DESC = 255


def _truncate_str(val: Any, max_len: int) -> Optional[str]:
    """确保字符串不超过指定的长度，防止数据库 'Data too long' 错误。"""
    if val is None:
        return None
    if not isinstance(val, str):
        val = str(val)
    
    # 针对中文等非ASCII字符，Python的切片是安全的，一个汉字算一个字符
    if len(val) <= max_len:
        return val
    
    return val[:max_len]

def _ensure_list(val: Any) -> List[Any]:
    """确保返回一个列表，如果输入是 None 或非列表，返回空列表。"""
    if isinstance(val, list):
        return val
    return []

def _ensure_dict_list(val: Any) -> List[Dict[str, Any]]:
    """确保返回一个字典列表，如果不是，返回空列表。"""
    if isinstance(val, list) and all(isinstance(i, dict) for i in val):
        return val
    return []


def load_data_from_json(filepath: str) -> List[Dict[str, Any]]:
    """从指定的 JSON 文件加载工具数据。"""
    if not os.path.exists(filepath):
        print(f"错误: 找不到文件 '{filepath}'。请确保文件存在。")
        return []
    
    print(f"-> 正在从文件 '{filepath}' 读取数据...")
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
            if isinstance(data, list):
                print(f"-> 成功读取 {len(data)} 条记录。")
                return data
            else:
                print("警告: JSON 文件内容不是一个列表 ([]), 跳过导入。")
                return []
        except json.JSONDecodeError as e:
            print(f"错误: 解析 JSON 文件失败: {e}")
            return []


# ----------------------------------------------------
# 2. 数据拆分和插入逻辑 (包含防重复检查与截断)
# ----------------------------------------------------

# 定义原始 JSON 数据的字段映射 (使用您的模型字段名)
CORE_FIELDS_MAP = {
    "name": {"max": MAX_LEN_NAME}, 
    "official_link": {"max": MAX_LEN_LINK}, 
    "category": {"max": MAX_LEN_CATEGORY}, 
    "pricing_model": {}, 
    "is_featured": {}, 
    "tags": {}, 
    "logo_url": {"max": MAX_LEN_LINK}, 
    "rating": {}, 
    "screenshots": {}, 
    "video_url": {"max": MAX_LEN_LINK}, 
    "supported_platforms": {}
}

TRANSLATION_FIELDS_MAP = {
    "description": {}, # 大文本字段，不截断
    "short_description": {"max": MAX_LEN_SHORT_DESC}, 
    "category_name": {"max": MAX_LEN_CATEGORY}, 
    "features": {}, 
    "use_cases": {}, 
    "key_differentiators": {}, 
    "pricing_details": {}, 
    "meta_title": {"max": MAX_LEN_META_TITLE}, 
    "meta_description": {"max": MAX_LEN_META_DESC}, 
    "pros": {}, 
    "cons": {}
}


class ImportResult(object):
    """用于记录导入结果的简单容器"""
    def __init__(self):
        self.inserted = 0
        self.skipped = 0
        self.failed = 0
        self.errors = [] # 存储失败记录的详细信息 (name, error_message)

    def print_summary(self):
        print("\n--- 导入总结 ---")
        print(f"✅ 成功插入: {self.inserted} 条")
        print(f"⚠️ 跳过 (已存在): {self.skipped} 条")
        print(f"❌ 失败 (数据库/数据错误): {self.failed} 条")
        if self.failed > 0:
            print(f"请检查 errors.log 文件或控制台输出以获取 {self.failed} 条失败详情。")


def import_tool_data(data_list: List[Dict], lang_code: str = 'zh'):
    """
    处理原始工具 JSON 列表，将其拆分为 Tool, ToolTranslation 和 ToolFAQ 对象并插入数据库。
    """
    if not data_list:
        print("--- 没有数据可导入，操作跳过。---")
        return

    print(f"\n--- 开始导入 {len(data_list)} 条工具数据 (语言: {lang_code}) ---")

    results = ImportResult()
    # 使用一个 Session 来处理所有记录
    with Session(engine) as session: 
        for tool_json in data_list:
            tool_name = tool_json.get("name")
            
            if not tool_name:
                results.failed += 1
                results.errors.append({"name": "N/A", "error": "Tool entry is missing 'name'."})
                continue
                
            # 1. 检查核心 Tool 是否已存在 (根据 name)
            existing_tool = session.exec(select(Tool).where(Tool.name == tool_name)).first()

            tool_id = None
            tool_slug = None

            try:
                is_new_tool = False
                if existing_tool:
                    tool_id = existing_tool.id
                    tool_slug = existing_tool.slug # 使用已存在的 slug
                    
                    # 更新 updated_at
                    existing_tool.updated_at = datetime.now(timezone.utc) # 修复 DeprecationWarning
                    session.add(existing_tool)
                    
                else:
                    is_new_tool = True
                    
                    # 只有在创建新工具时才生成 slug
                    generated_slug = generate_unique_slug(session, Tool, tool_name)

                    if not generated_slug:
                        results.failed += 1
                        results.errors.append({"name": tool_name, "error": "Failed to generate unique slug for new tool."})
                        continue # 跳到下一条记录

                    tool_slug = generated_slug
                    
                    # 核心 Tool 不存在，创建新记录
                    core_data = {}
                    for k, v in CORE_FIELDS_MAP.items():
                        raw_val = tool_json.get(k)
                        if 'max' in v:
                            core_data[k] = _truncate_str(raw_val, v['max'])
                        elif k in ["tags", "screenshots", "supported_platforms"]:
                            core_data[k] = _ensure_list(raw_val)
                        else:
                            core_data[k] = raw_val

                    core_data['review_status'] = str(tool_json.get('review_status', ReviewStatus.PUBLISHED))
                    core_data['slug'] = _truncate_str(tool_slug, MAX_LEN_SLUG)
                    
                    new_tool = Tool.model_validate(core_data)
                    
                    # 必须立即提交以获取 tool_id，供后续外键关联
                    session.add(new_tool)
                    session.commit() 
                    session.refresh(new_tool) 
                    tool_id = new_tool.id

                # 2. 检查翻译是否已存在 (根据 tool_id 和 lang_code)
                existing_translation = session.exec(
                    select(ToolTranslation)
                    .where(ToolTranslation.tool_id == tool_id, ToolTranslation.lang_code == lang_code)
                ).first()

                if existing_translation:
                    results.skipped += 1
                    
                    # 仅在跳过翻译时，并回滚之前对 existing_tool 的 updated_at 更新
                    if not is_new_tool:
                        session.rollback() 
                        
                    continue

                # 3. 拆分并插入翻译字段 (ToolTranslation)
                translation_data = {}
                for k, v in TRANSLATION_FIELDS_MAP.items():
                    raw_val = tool_json.get(k)
                    if 'max' in v:
                        translation_data[k] = _truncate_str(raw_val, v['max'])
                    elif k in ["features", "use_cases", "key_differentiators", "pros", "cons"]:
                        translation_data[k] = _ensure_list(raw_val)
                    else:
                        translation_data[k] = raw_val

                translation_data['lang_code'] = lang_code
                translation_data['tool_id'] = tool_id
                
                new_translation = ToolTranslation.model_validate(translation_data)
                session.add(new_translation)

                # 4. 拆分并插入 FAQ 列表 (ToolFAQ)
                faqs_list = _ensure_dict_list(tool_json.get("faqs", []))
                faq_objects = []
                for i, faq_item in enumerate(faqs_list):
                    faq_data = {
                        'tool_id': tool_id,
                        'lang_code': lang_code,
                        'faq_order': i, 
                        'question': faq_item.get('question', ''),
                        'answer': faq_item.get('answer', ''),
                    }
                    faq_objects.append(ToolFAQ.model_validate(faq_data))
                
                # 批量添加 FAQ 对象
                session.add_all(faq_objects)
                
                # 提交当前工具的所有相关记录 (ToolTranslation + ToolFAQ)
                session.commit()
                results.inserted += 1 # 只有完成全部插入才算成功
                
            except Exception as e:
                import traceback
                error_message = f"{type(e).__name__}: {str(e)}"
                
                session.rollback() # 事务回滚，确保失败的记录不会部分写入
                
                results.failed += 1
                # 记录简要信息到 errors 列表，并将完整的 Traceback 存入 errors.log
                results.errors.append({"name": tool_name, "error": error_message, "details": traceback.format_exc()})
                
                print(f"❌ 失败：工具 '{tool_name}' 导入失败，已回滚事务。")
                print(f"   错误详情: {error_message}")
                
        # 写入错误日志文件
        if results.failed > 0:
            error_log_path = Path(__file__).parent / "errors.log"
            with open(error_log_path, 'w', encoding='utf-8') as f:
                # 记录错误日志时间，使用带时区的 UTC 时间
                f.write(f"--- 导入失败记录 ({datetime.now(timezone.utc).isoformat()}) ---\n") 
                f.write(json.dumps(results.errors, ensure_ascii=False, indent=2))
            print(f"⚠️ 详细错误信息已写入: {error_log_path.resolve()}")

    results.print_summary() # 打印最终总结


if __name__ == "__main__":
    # ----------------------------------------------------
    # 动态获取文件名并运行导入
    # ----------------------------------------------------
    DEFAULT_FILE_NAME = "tools_to_import.json"
    
    if len(sys.argv) > 1:
        # 如果提供了命令行参数 (sys.argv[1] 是第一个参数)，使用它作为文件名
        tools_file_name = sys.argv[1]
    else:
        # 否则使用默认文件名
        tools_file_name = DEFAULT_FILE_NAME
        print(f"警告: 未指定 JSON 文件名，将使用默认文件名: '{tools_file_name}'。")

    
    # 运行数据加载和导入
    data_to_import = load_data_from_json(tools_file_name)
    import_tool_data(data_to_import, lang_code='zh')
    
    # 更新提示信息，指导用户如何使用动态文件名
    script_name = os.path.basename(sys.argv[0])
    print(f"\n💡 请在运行脚本前，确保您已激活虚拟环境。")
    print(f"运行示例:")
    print(f"   - 使用默认文件: python {script_name}")
    print(f"   - 使用上传文件: python {script_name} /path/to/your/uploaded_file.json")