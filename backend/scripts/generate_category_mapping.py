# generate_mapping.py

import argparse
import json
import os
from typing import Dict, List, Set, Any

# --- 引入依赖：从 api_utils 模块导入所有必需函数 ---
# 注意：如果您的脚本不在Python包结构中，请使用 from api_utils import ... 
# 确保 api_utils.py 文件与本文件位于同一目录或 Python 路径下。
try:
    from ai_api_utils import load_tools, save_mapping, call_model, extract_json_from_text 
except ImportError:
    # 尝试相对导入，以备在包环境中使用
    from ai_api_utils import load_tools, save_mapping, call_model, extract_json_from_text
except Exception as e:
    print(f"致命错误：无法导入 api_utils.py 中的依赖函数。请检查文件是否存在且函数已定义。错误: {e}")
    exit(1)
# ---------------------------------------------------------------------------------


# --- 核心辅助函数：获取未映射分类 ---

def get_unmapped_categories(tools: List[Dict[str, Any]], existing_mapping: Dict[str, str]) -> Set[str]:
    """
    从所有工具中提取所有唯一的 'category'，并排除已存在于现有映射中的分类。
    
    :param tools: 包含工具数据的列表。
    :param existing_mapping: 现有的原始分类 -> 展示分类的字典。
    :return: 尚未在映射中出现的所有原始分类名称集合。
    """
    all_categories = set()
    for tool in tools:
        if 'category' in tool:
            all_categories.add(tool['category'])
            
    # 排除已存在于映射中的分类
    unmapped = all_categories - set(existing_mapping.keys())
    return unmapped


# --- 映射生成核心逻辑：让模型执行聚类和命名 ---

def generate_clustering_prompt(unmapped_categories: Set[str]) -> str:
    """
    生成用于让模型执行分类聚类、命名和映射的提示。
    """
    
    unmapped_list_str = "\n- ".join(sorted(list(unmapped_categories)))
    
    prompt = (
        "你是一个专业的 AI 工具分类体系设计师。你的任务是分析一堆不规范的原始分类名称，并执行以下操作：\n"
        "1. **聚类 (Clustering):** 根据语义和功能相似性，将这些原始分类分成最合理的几个组（至少 3 组，最多 15 组）。\n"
        "2. **命名 (Naming):** 为你创建的每个组定义一个简洁、通用且用户友好的**目标展示分类名称**（不超过6个汉字）。\n"
        "3. **映射 (Mapping):** 将每个原始分类映射到你定义的展示分类名称上。\n"
        "4. **输出格式:** 严格返回一个 JSON 对象，其中 Key 是原始分类名称，Value 是你为它指定的**目标展示分类名称**。\n"
        "\n--- 待聚类和映射的原始分类列表 ---\n"
        f"- {unmapped_list_str}\n"
        "\n请开始你的聚类和映射，并以 JSON 格式输出结果。"
    )
    return prompt

def main():
    parser = argparse.ArgumentParser(description="使用 LLM 自动生成分类映射配置（无需预设目标分类）。")
    parser.add_argument("--tools_file", default="seo_tools_validated.json", help="包含所有工具数据的 JSON 文件路径。")
    parser.add_argument("--mapping_file", default="category_mapping.json", help="现有映射配置的 JSON 文件路径。")
    args = parser.parse_args()

    tools_path = args.tools_file
    mapping_path = args.mapping_file
    
    # 1. 加载现有数据和配置
    print(f"Loading tools from {tools_path}...")
    tools_data = load_tools(tools_path)
    
    print(f"Loading existing mapping from {mapping_path}...")
    # 注意：load_tools 可以加载列表或字典，这里期望是字典
    existing_mapping = load_tools(mapping_path) if os.path.exists(mapping_path) else {}
    if isinstance(existing_mapping, list):
         # 如果加载出来是列表，说明文件可能是空的或结构错误，重置为字典
        existing_mapping = {}
    
    # 2. 识别未映射的分类
    unmapped_categories = get_unmapped_categories(tools_data, existing_mapping)
    
    if not unmapped_categories:
        print("✅ No new unmapped categories found. Exiting.")
        return

    print(f"\n💡 Found {len(unmapped_categories)} new categories requiring mapping.")
    print("待映射的分类示例:", list(unmapped_categories)[:5])

    # 3. 生成提示并调用模型 (使用聚类提示)
    # Strengthen the prompt to request a smaller, more user-friendly set of display categories
    prompt = generate_clustering_prompt(unmapped_categories)
    # Append additional instructions to encourage consolidation and concise labels
    prompt += (
        "\n\n重要：请将最终的唯一展示分类数量控制在 6 到 10 个之间（优先 8-10）。"
        " 如果存在许多细分，请将语义相近或同义的原始分类合并为更宽泛的展示分类。"
        " 展示分类名称应简洁（中文≤6字），避免同义重复或过度细分。"
    )
    
    try:
        print("\n--- Calling LLM for automatic CLUSTERING and MAPPING (This may take a minute) ---")
        model_response = call_model(prompt) 
        
        # 4. 解析模型返回的 JSON 
        new_mapping = extract_json_from_text(model_response)
        
        if not isinstance(new_mapping, dict):
            raise ValueError("Model did not return a valid JSON object (Dictionary) for mapping.")
        
        # 5. 校验模型返回的映射质量
        suggested_targets = set(new_mapping.values())
        print(f"\n--- Model Suggested {len(suggested_targets)} Display Categories ---")
        print("建议的展示分类:", list(suggested_targets))
            
        print("\n--- New Mappings Generated ---")
        # 仅显示新生成的映射，方便审核
        for k, v in new_mapping.items():
            if k not in existing_mapping:
                print(f"'{k}' -> '{v}'")

        # 6. 合并并保存配置
        updated_mapping = existing_mapping.copy()
        updated_mapping.update(new_mapping)

        # 使用 save_mapping 保存，确保格式是字典
        save_mapping(updated_mapping, mapping_path)

        # 7. 将映射写入数据库（如果需要）——调用 upsert 工具将映射持久化到 category_mapping 表
        try:
            # 延迟导入以避免在不需要 DB 时引入依赖
            from scripts.upsert_category_mapping import upsert_mapping
            print('\n--- Upserting mapping into DB (this will insert or update rows) ---')
            summary = upsert_mapping(updated_mapping)
            print('\nUpsert summary:', summary)
        except Exception as e:
            print('\nWarning: failed to upsert mapping into DB:', e)
        
    except Exception as e:
        print(f"\n❌ ERROR during mapping generation: {e}")
        # 如果模型响应变量存在，打印原始响应以供调试
        if 'model_response' in locals():
             print(f"Raw model response was: {model_response}")


if __name__ == "__main__":
    main()

    # 运行示例:
    #python generate_category_mapping.py --tools_file seo_tools_validated.json --mapping_file category_mapping.json