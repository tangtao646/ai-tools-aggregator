# validate_seo_tools.py

#!/usr/bin/env python3
"""
Validate and correct tool metadata using the Generative API (Gemini or OpenAI).

Key features:
1. Implemented robust checkpointing/resumption based on the 'name' property.
2. Included 10-second delay to mitigate 429 quota errors.
3. Records failed validation attempts to a separate JSON file.
4. FIX: Only successful API calls (without timeouts/errors) are written to the 
   success file. Failures are logged separately for re-evaluation.

Dependencies: Loads all helper functions from api_utils.py
"""

import argparse
import json
import os
import time
from typing import Dict, Any, List, Set

# --- 引入依赖：从 api_utils 模块导入所有必需函数 ---
from ai_api_utils import (
    load_tools,
    save_tools,
    fetch_site_metadata,
    call_model,
    extract_json_from_text
)
# ----------------------------------------------------

# --- Checkpointing Logic (保持不变) ---

def load_processed_names(out_path: str, failed_out_path: str) -> Set[str]:
    """
    Scans the successful output file and failed output file to collect the names
    of all previously processed tools for checkpointing.
    """
    processed_names = set()
    
    # 1. 扫描成功输出文件
    if os.path.exists(out_path):
        data = load_tools(out_path)
        for tool in data:
            if 'name' in tool:
                processed_names.add(tool['name'])

    # 2. 扫描失败输出文件 (跳过这些名称，避免下次再次记录失败)
    if os.path.exists(failed_out_path):
        failed_data = load_tools(failed_out_path)
        for tool in failed_data:
            if 'name' in tool:
                processed_names.add(tool['name'])
            
    return processed_names


# --- Prompt Generation (保持不变) ---

def make_prompt(tool: Dict[str, Any], site_meta: Dict[str, Any]) -> str:
    """Build a clear prompt asking the model to return a validated object and a report."""
    current = {k: tool.get(k) for k in tool.keys()}
    
    prompt = (
        "你是一个严格的元数据验证器。给定工具的原始数据和官方网站的元数据，请验证除 'name', 'official_link', 'logo_url' 之外的所有字段。\n"
        "你的目标是：如果有任何字段（例如 category, description, tags 等）不准确或可以从网站元数据或常识中得到更正，请提供更正后的值。\n"
        "请返回一个严格的 JSON 对象（不要包含任何解释性文字或 Markdown 块），包含以下两个键：\n"
        "  - `validated_tool`: 一个对象，**只包含**你已验证或修正过的字段及其新值。未修正的字段或被认为是正确的字段不应包含在此对象中。\n"
        "  - `report`: 一个对象列表，详细说明你对每个字段的验证或修正过程（包含 '字段', '原始值', '修正后的值', '修正原因/来源'）。\n"
        "例如: {\"validated_tool\": {\"category\": \"SEO\", \"rating\": 4.5}, \"report\": [{\"字段\": \"rating\", \"原始值\": 3.9, \"修正后的值\": 4.5, \"修正原因/来源\": \"官网平均评分\"}]}\n"
        "Site metadata (如果可用):\n"
    )
    prompt += json.dumps(site_meta, ensure_ascii=False, indent=2)
    prompt += "\n\nCurrent tool data:\n"
    prompt += json.dumps(current, ensure_ascii=False, indent=2)
    prompt += (
        "\n\n注意：返回的JSON必须是严格的，并且所有修正必须以对象形式放在 `validated_tool` 键下，**不要包含** name, official_link, logo_url。\n"
        "**【重要】** 你的整个输出内容必须且只能是那个 JSON 对象。**不要添加任何解释性文字或 Markdown 代码块（例如，不要使用 ```json 或 ```）**。"
    )
    return prompt


# --- Main Validation Logic (保持不变) ---

def stream_validate_tools(tools: List[Dict[str, Any]], out_path: str, failed_out_path: str, max_items: int = None) -> List[Dict[str, Any]]:
    """
    Validate tools, overwrite fields, and safely handle checkpointing.
    Uses memory caching for successful runs and overwrites the final output file.
    Only strictly successful validations are written to the success file.
    """
    total = len(tools)
    ground_truth_keys = {"name", "official_link", "logo_url"}
    failed_entries = load_tools(failed_out_path)
    
    validated_count = 0 
    skipped_count = 0 
    
    processed_names = load_processed_names(out_path, failed_out_path)
    
    print(f"\n💡 Found {len(processed_names)} previously processed entries. Starting validation...")

    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    
    is_resuming = len(processed_names) > 0
    
    newly_validated_data = []

    try:
        
        for i, tool in enumerate(tools):
            name = tool.get("name")
            
            if name in processed_names:
                print(f"--- [{i+1}/{total}] 跳过已处理: {name} ---")
                skipped_count += 1
                continue
                
            if max_items and validated_count >= max_items:
                break
            
            link = tool.get("official_link")
            print(f"\n--- [{i+1}/{total}] 验证开始: {name} ---")
            
            site_meta = fetch_site_metadata(link) if link else {}
            prompt = make_prompt(tool, site_meta)
            
            merged_tool = dict(tool)
            raw_response = None
            process_success = False 
            
            # 2. Call Model & Process
            try:
                resp = call_model(prompt)
                raw_response = resp
                parsed = extract_json_from_text(resp)
                
                # 3. Extract and Apply Corrections
                validated_data = parsed.get("validated_tool", {})
                report = parsed.get("report", [])
                
                print(f"--- 验证报告 for {name} ---")
                applied_corrections = 0
                if report and isinstance(report, list):
                    for item in report:
                        print(f"  - 字段: {item.get('字段', 'N/A')}")
                        print(f"    原始值: {item.get('原始值', 'N/A')}")
                        print(f"    -> 新值: {item.get('修正后的值', 'N/A')}")
                        print(f"    原因: {item.get('修正原因/来源', 'N/A')}")
                else:
                    print("模型未返回有效修正报告或报告结构错误。")

                for key, value in validated_data.items():
                    if key not in ground_truth_keys:
                        if merged_tool.get(key) != value:
                            merged_tool[key] = value
                            applied_corrections += 1
                            
                print(f"--- 修正完成 ({applied_corrections} 处字段被修正) ---")
                entry = merged_tool
                process_success = True 
                
            except Exception as e:
                error_message = str(e)
                print(f"\n[ERROR] 验证失败 for {name}: {error_message}")
                
                failed_entry = dict(tool)
                failed_entry["_validation_error"] = error_message
                if raw_response:
                    failed_entry["_error_raw_response"] = raw_response
                
                if name not in [f.get('name') for f in failed_entries]:
                    failed_entries.append(failed_entry)
                    
            
            # 4. 仅在模型调用和 JSON 解析成功时，才添加到成功缓存
            if process_success: 
                output_entry = {k: v for k, v in entry.items() if not k.startswith("_error_") and not k.startswith("_validation_")}
                newly_validated_data.append(output_entry)
                validated_count += 1
            
            print("--- 等待 55 秒以避免配额限制 (429 错误) ---")
            time.sleep(20) 
            
    except Exception as e:
        print(f"\nCRITICAL ERROR during streaming validation: {e}")
    finally:
        # 5. 写入最终文件
        historical_data = load_tools(out_path) if is_resuming else []
        final_data = historical_data + newly_validated_data
        
        if final_data:
            save_tools(final_data, out_path)
            print(f"Successfully merged {len(historical_data)} historical and {len(newly_validated_data)} newly validated entries to {out_path}.")
        elif not is_resuming:
             save_tools([], out_path)
            
    print(f"\n--- 总结: 跳过 {skipped_count} 条，本次校验 {validated_count} 条 ---")
    return failed_entries


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input", default="seo_tools.json")
    p.add_argument("--output", default="seo_tools_validated.json")
    p.add_argument("--failed_output", default="seo_tools_validated_failed.json") 
    p.add_argument("--max", type=int, default=0, help="max number of tools to validate (0 = all)")
    args = p.parse_args()
    inp = args.input
    outp = args.output
    failed_outp = args.failed_output
    max_items = args.max if args.max > 0 else None
    
    print("Loading tools from", inp)
    tools = load_tools(inp)
    print(f"Loaded {len(tools)} tools; validating up to {max_items or 'ALL'} and saving to {outp}")
    
    failed_list = stream_validate_tools(tools, outp, failed_outp, max_items=max_items)
    
    print("\nDone. Validation results saved to", outp)
    
    if failed_list:
        save_tools(failed_list, failed_outp)
        print(f"🚨 Total {len(failed_list)} entries failed validation (including historical ones) and were saved to {failed_outp}")
    else:
        if os.path.exists(failed_outp):
             os.remove(failed_outp)
        print("✅ All remaining entries validated successfully. No failed entries to report.")


if __name__ == "__main__":
    # 为了正确处理相对导入 (.api_utils)，请确保您的工作目录设置正确
    # 如果遇到 ImportError，请确保您的项目被识别为一个 Python 包
    main()


    # 运行示例:
    #python new_validate_seo_tools.py --input seo_tools.json --output seo_tools_validated.json  --failed_output seo_tools_validated_failed.json