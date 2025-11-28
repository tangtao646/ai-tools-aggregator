import json
import re
import requests
import os
from typing import List, Dict, Tuple, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

# --- ⚙️ 配置区域 ---
# 输入文件：你之前的抓取结果
INPUT_FILE = "/Users/tangtao/ai-tools-aggregator/backend/scripts/aitoolhub_shallow_data.json"
# 临时文件：实时写入（过程可见）
TEMP_FILE = "/Users/tangtao/ai-tools-aggregator/backend/scripts/temp_tool_model_valid.jsonl"
# 最终文件：清洗完成后的标准 JSON
FINAL_OUTPUT_FILE = "/Users/tangtao/ai-tools-aggregator/backend/scripts/aitoolhub_cleaned_original.json"

MAX_WORKERS = 50   # 线程并发数
TIMEOUT = 10       # 网络请求超时(秒)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# --- 核心逻辑 ---

def is_valid_url_regex(url: str) -> bool:
    if not isinstance(url, str) or not url.strip():
        return False
    # 宽松正则
    regex = re.compile(
        r'^(?:http|ftp)s?://' 
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|' 
        r'localhost|' 
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})' 
        r'(?::\d+)?' 
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return re.match(regex, url) is not None

def check_network_connectivity(url: str) -> Tuple[bool, str]:
    """检测链接是否存活 (HEAD优先)"""
    try:
        # 1. HEAD
        response = requests.head(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
        if 200 <= response.status_code < 400:
            return True, f"HEAD {response.status_code}"
        # 2. GET
        response = requests.get(url, headers=HEADERS, stream=True, timeout=TIMEOUT, allow_redirects=True)
        if 200 <= response.status_code < 400:
            return True, f"GET {response.status_code}"
        
        return False, f"Status {response.status_code}"
    except Exception as e:
        return False, str(e)

def process_single_tool(tool: Dict) -> Tuple[Optional[Dict], str, str]:
    """
    针对 Tool 模型进行校验。
    验证通过 -> 返回 (原始tool, "success", "OK")
    验证失败 -> 返回 (None, 错误码, 错误详情)
    """
    
    # --- 1. 提取字段 (根据你的 Tool 模型) ---
    # 模型字段: title, location_url, img, description, cate_name
    
    title = tool.get('title')
    target_url = tool.get('location_url')
    target_img = tool.get('img')
    desc = tool.get('description')
    cate_data = tool.get('cate_name') # 可能是 dict, list, 或 str

    # --- 2. 静态规则校验 ---

    # 校验标题
    if not title or not str(title).strip():
        return None, "missing_title", "标题为空"

    # 校验描述长度 (至少10个字符)
    if not desc or len(str(desc).strip()) < 10:
        return None, "short_desc", f"描述过短: {str(desc)[:10]}..."

    # 校验分类 (支持 Dict/List/Str)
    has_category = False
    if isinstance(cate_data, dict) and cate_data: # 非空字典
        has_category = True
    elif isinstance(cate_data, list) and len(cate_data) > 0: # 非空列表
        has_category = True
    elif isinstance(cate_data, str) and cate_data.strip(): # 非空字符串
        has_category = True
    
    if not has_category:
        return None, "missing_category", f"分类数据为空: {cate_data}"

    # 校验 URL 格式
    if not is_valid_url_regex(target_url):
        return None, "invalid_url_format", f"URL格式错误: {target_url}"
    
    # 校验 图片 URL 格式 (可选，如果不严格可以注释掉)
    if target_img and not is_valid_url_regex(target_img):
         return None, "invalid_img_format", f"图片URL错误: {target_img}"

    # --- 3. 动态网络校验 (耗时操作) ---
    
    # 检测官网连通性
    is_connected, net_msg = check_network_connectivity(target_url)
    if not is_connected:
        return None, "dead_link_website", f"官网无法访问: {net_msg}"

    # 检测图片连通性 (可选，为了保证网站美观建议开启)
    if target_img:
        img_ok, img_msg = check_network_connectivity(target_img)
        if not img_ok:
             return None, "dead_link_img", f"图片无法加载: {img_msg}"

    # --- 4. 通过校验，返回原始数据 (不修改结构) ---
    return tool, "success", "OK"

def main():
    print(f"📂 读取源文件: {INPUT_FILE}")
    if not os.path.exists(INPUT_FILE):
        print("❌ 输入文件不存在")
        return

    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)
    except Exception as e:
        print(f"❌ JSON 读取失败: {e}")
        return

    print(f"🔢 原始数据量: {len(raw_data)} 条")
    print(f"🚀 开始清洗 (保留原始结构)...")
    print(f"📝 实时写入临时文件: {TEMP_FILE}")

    stats = {"success": 0, "fail": 0}
    fail_reasons = {}

    # 打开临时文件准备写入
    with open(TEMP_FILE, 'w', encoding='utf-8') as temp_f:
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_to_tool = {executor.submit(process_single_tool, tool): tool for tool in raw_data}
            
            for future in tqdm(as_completed(future_to_tool), total=len(raw_data), unit="tool"):
                result_tool, reason, debug_msg = future.result()
                
                if result_tool:
                    # 校验成功：写入原始 JSON 对象
                    json_line = json.dumps(result_tool, ensure_ascii=False)
                    temp_f.write(json_line + '\n')
                    temp_f.flush() # 确保数据落盘
                    stats["success"] += 1
                else:
                    # 校验失败
                    stats["fail"] += 1
                    fail_reasons[reason] = fail_reasons.get(reason, 0) + 1

    print("\n" + "="*40)
    print("✅ 清洗完成，正在生成最终 JSON 文件...")

    # 将 JSONL 转回 JSON 数组
    final_list = []
    if os.path.exists(TEMP_FILE):
        with open(TEMP_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    final_list.append(json.loads(line))
    
    with open(FINAL_OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_list, f, ensure_ascii=False, indent=2)

    # os.remove(TEMP_FILE) # 可选：删除临时文件

    print("="*40)
    print(f"📊 结果统计")
    print(f"📥 输入总数: {len(raw_data)}")
    print(f"✅ 有效保留: {len(final_list)}")
    print(f"🗑️  总计过滤: {stats['fail']}")
    print("-" * 40)
    print("❌ 过滤原因分布:")
    for r, count in fail_reasons.items():
        print(f"   - {r}: {count} 条")
    print("="*40)
    print(f"💾 最终文件: {FINAL_OUTPUT_FILE}")

if __name__ == "__main__":
    main()