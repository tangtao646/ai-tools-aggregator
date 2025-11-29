import json
import os
import sys
import time
from typing import List, Dict, Any, Tuple

# 导入您的 API 工具类中的所需函数
try:
    from ai_api_utils import call_model, extract_json_from_text, save_tools, load_tools
except ImportError as e:
    print(f"Error: Could not import api_utils.py. Please ensure the file is in the same directory. Details: {e}")
    sys.exit(1)

# --- 配置常量 ---
API_CALL_DELAY_SECONDS = 5
KEY_PROPERTY_FOR_RESUME = "name"
FIELDS_TO_DISPLAY = ["name", "category_name", "short_description"]
# ------------------

def translate_single_item_by_llm(item: Dict[str, Any], target_lang: str) -> Tuple[Dict[str, Any], bool]:
    """
    使用 LLM 翻译单个 JSON 字典。
    返回: (翻译结果或原始数据, 是否成功)
    """
    source_json_str = json.dumps([item], ensure_ascii=False, indent=2)

    prompt = f"""
    您是一位拥有超过10年经验的资深专业翻译师，专注于AI和技术行业的内容翻译。
    您的任务是将以下 JSON 结构中的 **所有值（Value）** 从中文翻译成 **{target_lang}**。

    --- 翻译要求 (严格遵循) ---
    1. **键（Key）不变：** 绝对不能翻译 JSON 中的任何键（Key）。
    2. **保持结构：** 必须返回一个结构与输入完全相同的 **JSON 列表**，且该列表只包含一个翻译后的字典。
    3. **跳过规则：** - 已经为 {target_lang} 的值（Value）无需翻译。
       - URL、文件路径、数字或布尔值无需翻译。
    4. **专业性：** 保持原文的专业含义和专业术语。

    --- 输入 JSON 数据 ---
    ```json
    {source_json_str}
    ```

    --- 输出格式要求 ---
    请直接返回翻译后的完整 JSON 结构（即一个包含单个字典的列表），并确保它是一个完全有效的、可被 Python `json.loads` 解析的 JSON。
    """

    try:
        print(f"[API Call] Calling model for item: {item.get(KEY_PROPERTY_FOR_RESUME, 'N/A')}")
        llm_response_text = call_model(prompt)
        translated_json_list = extract_json_from_text(llm_response_text)

        if isinstance(translated_json_list, list) and len(translated_json_list) > 0 and isinstance(translated_json_list[0], dict):
            # 翻译成功
            return translated_json_list[0], True
        else:
            raise ValueError("Model returned an invalid structure (expected a list containing one dictionary).")

    except Exception as e:
        # 翻译失败 (API 错误, 超时, JSON 解析失败)
        print(f"\n[ERROR] 翻译失败 (Name: {item.get(KEY_PROPERTY_FOR_RESUME, 'N/A')}, Error: {e}).")
        # 返回原始数据和失败状态
        return item, False 

def translate_json_resumable_with_split(
    data: List[Dict[str, Any]], 
    target_lang: str, 
    success_output_path: str,
    failed_output_path: str,
    key_property: str
) -> Dict[str, int]:
    """
    支持断点续传、成功/失败分离保存的逐条翻译。
    返回: 包含成功、失败和跳过数量的字典。
    """
    
    # 确保输出目录存在 (如果路径中包含目录)
    os.makedirs(os.path.dirname(success_output_path) or '.', exist_ok=True)
    os.makedirs(os.path.dirname(failed_output_path) or '.', exist_ok=True)
    
    # 1. 尝试加载已翻译的成功数据（断点续传的唯一检查点）
    translated_success_data = load_tools(success_output_path)
    # 2. 尝试加载已失败的数据
    translated_failed_data = load_tools(failed_output_path)
    
    # 3. 创建已成功翻译条目的快速查找映射
    translated_names = {
        item.get(key_property): True
        for item in translated_success_data
        if item and item.get(key_property)
    }
    
    # 4. 初始化统计信息
    stats = {
        "total_items": len(data),
        "skipped_count": len(translated_names),
        "newly_successful_count": 0,
        "newly_failed_count": 0,
        "previous_failed_count": len(translated_failed_data)
    }
    
    print(f"\n--- 翻译任务启动 ---")
    print(f"总记录数: {stats['total_items']} | 目标语言: {target_lang}")
    print(f"已成功记录数: {stats['skipped_count']}")
    print(f"先前失败记录数: {stats['previous_failed_count']}")
    print(f"待翻译/重试记录数: {stats['total_items'] - stats['skipped_count']}")
    print("----------------------")

    for i, item in enumerate(data):
        item_name = item.get(key_property)
        current_index = i + 1
        
        # 确保关键属性存在
        if not item_name:
            print(f"[警告] 第 {current_index} 条记录缺少关键属性 '{key_property}'，跳过。")
            continue

        # 检查是否已成功翻译（断点续传逻辑）
        if item_name in translated_names:
            print(f"[跳过] 第 {current_index}/{stats['total_items']} 条 (Name: {item_name}) 已成功翻译，跳过...")
            continue
        
        # 3. 执行翻译
        print(f"\n[处理进度] 正在翻译第 {current_index}/{stats['total_items']} 条 (Name: {item_name})...")
        translated_item, is_success = translate_single_item_by_llm(item, target_lang)
        
        if is_success:
            # --- 成功逻辑 ---
            stats["newly_successful_count"] += 1
            translated_success_data.append(translated_item)
            
            # 实时展示翻译内容
            print("\n--- 实时翻译结果概览 (✅ 成功) ---")
            for field in FIELDS_TO_DISPLAY:
                translated_value = translated_item.get(field, '[N/A]')
                display_value = (translated_value[:100] + '...') if isinstance(translated_value, str) and len(translated_value) > 100 else translated_value
                print(f"| {field:<18}: {display_value}")
            print("-----------------------------------")
            
            # 实时保存到成功文件
            save_tools(translated_success_data, success_output_path)
            print(f"   [保存成功] 实时保存至成功文件: {success_output_path}。")
            
            # 检查并从失败列表中移除（如果之前失败过）
            if item in translated_failed_data:
                 translated_failed_data.remove(item)

        else:
            # --- 失败逻辑 ---
            stats["newly_failed_count"] += 1
            # 仅将原始条目添加到失败列表（不含错误信息，方便重试）
            if item not in translated_failed_data:
                translated_failed_data.append(item)
            
            # 实时保存到失败文件
            save_tools(translated_failed_data, failed_output_path)
            print(f"   [保存失败] 实时保存原始数据至失败文件: {failed_output_path}。")
            
        # 速率控制
        if current_index < stats["total_items"]:
            print(f"   [速率控制] 等待 {API_CALL_DELAY_SECONDS} 秒...")
            time.sleep(API_CALL_DELAY_SECONDS)
            
    return stats

# --- 主执行逻辑：从外部加载数据 ---
if __name__ == "__main__":
    
    # --- 配置区域 ---
    TARGET_LANGUAGE = "English"
    DEFAULT_INPUT_FILE = "input_tools.json" 
    # ------------------
    
    # 尝试从命令行参数获取输入文件路径
    INPUT_FILE_PATH = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_INPUT_FILE
        
    # 检查原始输入文件是否存在
    if not os.path.exists(INPUT_FILE_PATH):
        print("\n" + "="*50)
        print(f"❌ 致命错误: 找不到原始输入文件: '{INPUT_FILE_PATH}'")
        print("请确保该文件存在，或通过命令行参数指定正确的文件路径。")
        print("="*50)
        sys.exit(1) 
    
    # 1. 从外部文件加载数据
    print(f"\n--- 正在从文件加载原始数据: {INPUT_FILE_PATH} ---")
    input_data = load_tools(INPUT_FILE_PATH)
    
    if not input_data:
        print("Error: Loaded data is empty or corrupted. Aborting translation.")
        sys.exit(1)
        
    # 2. 定义成功和失败文件路径
    base_name = os.path.splitext(os.path.basename(INPUT_FILE_PATH))[0]
    
    # 成功文件路径
    SUCCESS_OUTPUT_PATH = f"{base_name}_translated_success_{TARGET_LANGUAGE.lower()}.json"
    # 失败文件路径
    FAILED_OUTPUT_PATH = f"{base_name}_translated_failed_{TARGET_LANGUAGE.lower()}.json"
    
    # 3. 执行带延迟、断点续传和成功/失败分离的翻译
    stats = translate_json_resumable_with_split(
        data=input_data,
        target_lang=TARGET_LANGUAGE,
        success_output_path=SUCCESS_OUTPUT_PATH,
        failed_output_path=FAILED_OUTPUT_PATH,
        key_property=KEY_PROPERTY_FOR_RESUME
    )

    # 4. 最终完成消息
    print("\n" + "="*50)
    print(f"🎉 翻译任务完成！统计报告")
    print("="*50)
    print(f"总记录数: {stats['total_items']}")
    print(f"已跳过记录数: {stats['skipped_count']}")
    
    # 打印本次运行的结果
    print("-" * 20)
    print(f"本次运行新增成功: {stats['newly_successful_count']} 条。")
    print(f"本次运行新增失败: {stats['newly_failed_count']} 条。")
    print("-" * 20)

    # 打印最终文件信息
    print(f"✅ 成功数据（总计 {stats['skipped_count'] + stats['newly_successful_count']} 条）已保存在: {SUCCESS_OUTPUT_PATH}")
    print(f"❌ 失败数据（总计 {stats['previous_failed_count'] + stats['newly_failed_count']} 条）已保存在: {FAILED_OUTPUT_PATH}")
    print("="*50)

        #使用示例
        #python translator.py seo_tools_validated.json