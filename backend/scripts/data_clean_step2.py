import json
import os
import time # 导入 time 库
import random # 导入 random 库
from typing import List, Dict, Tuple 
from datetime import datetime
import whois # 需要: pip install python-whois
from tqdm import tqdm

# --- ⚙️ 配置区域 ---
# 读取第二次清洗的结果
INPUT_FILE = "/Users/tangtao/ai-tools-aggregator/backend/scripts/aitoolhub_cleaned_original.json"  
# 最终的精品列表 (最终输出的JSON数组文件)
OUTPUT_FILE = "/Users/tangtao/ai-tools-aggregator/backend/scripts/aitoolhub_high_quality_preview.json" 
# 临时文件 (用于边筛选边存储的JSON Lines文件)
TEMP_STREAM_FILE = "/Users/tangtao/ai-tools-aggregator/backend/scripts/aitoolhub_high_quality_temp.jsonl"


# --- 极高门槛过滤规则 ---
MIN_DESC_LENGTH = 1     # 描述最短长度 (已去除长度限制，只要存在内容即可)
MIN_CATEGORIES = 2      # 至少需要2个分类
MIN_DOMAIN_AGE_YEARS = 1 # 域名至少注册了1年 (信任度指标)

# WHOIS 重试配置
MAX_WHOIS_RETRIES = 3
MIN_WAIT_SECONDS = 1.0
MAX_WAIT_SECONDS = 3.0


def get_domain_age_in_years(url: str) -> float:
    """
    通过 WHOIS 查询域名注册时间，计算域名年龄 (年)。
    引入随机延迟和重试机制来规避 WHOIS 服务器的限速和超时。
    """
    domain = url.split("//")[-1].split("/")[0]
    
    # 排除 IP 地址
    if domain.replace('.', '').isdigit():
        return 0.0

    for attempt in range(MAX_WHOIS_RETRIES):
        # 强制引入随机延迟，模拟人类行为
        sleep_time = random.uniform(MIN_WAIT_SECONDS, MAX_WAIT_SECONDS)
        time.sleep(sleep_time)
        
        try:
            w = whois.whois(domain)
            
            # whois 库返回的 creation_date 可能是 datetime 对象或 list
            creation_date = w.creation_date
            if isinstance(creation_date, list):
                creation_date = creation_date[0]
                
            if creation_date and isinstance(creation_date, datetime):
                age_timedelta = datetime.now() - creation_date
                return age_timedelta.days / 365.25
            
            # 成功查询但未找到注册日期，返回 0.0
            return 0.0 
        except Exception as e:
            # print(f"WHOIS lookup failed for {domain} (Attempt {attempt+1}/{MAX_WHOIS_RETRIES}): {e}") # 调试信息
            if attempt == MAX_WHOIS_RETRIES - 1:
                # 达到最大重试次数，返回 0.0 (视为失败)
                return 0.0
            # 否则继续下一次重试

    return 0.0 # 理论上不会执行到这里


def count_categories(cate_data) -> int:
    """计算分类的数量，兼容 Dict/List/Str"""
    if isinstance(cate_data, dict):
        return len([v for v in cate_data.values() if v and str(v).strip()])
    elif isinstance(cate_data, list):
        return len([v for v in cate_data if v and str(v).strip()])
    elif isinstance(cate_data, str):
        return len([p.strip() for p in cate_data.split(',') if p.strip()])
    return 0

def is_ultra_high_quality(tool: Dict) -> Tuple[bool, str]: # 改变函数签名，返回失败原因
    """
    判断一个工具是否符合基于信任度和内容深度的极高标准
    """
    
    # --- 1. 信任度校验：域名年龄 (核心指标) ---
    url = tool.get('location_url')
    if not url: 
        return False, "no_url"
    
    domain_age = get_domain_age_in_years(url)
    tool['_domain_age'] = domain_age # 写入年龄，方便调试和展示
    
    if domain_age < MIN_DOMAIN_AGE_YEARS:
        # 如果域名年龄低于门槛 (或者 WHOIS 失败返回了 0.0)
        return False, f"domain_too_new_{domain_age:.2f}Y" 

    # --- 2. 内容深度校验 (仅检查存在性，不限制长度) ---
    
    # a. 描述长度 (MIN_DESC_LENGTH = 1)
    description = tool.get('description', '')
    if len(description.strip()) < MIN_DESC_LENGTH:
        return False, "no_description"

    # b. 至少有三个分类 (MIN_CATEGORIES - 排除功能单一的工具)
    cate_data = tool.get('cate_name')
    category_count = count_categories(cate_data)
    if category_count < MIN_CATEGORIES:
        return False, f"low_categories_{category_count}" 

    # --- 3. 市场友好度校验 ---
    
    # 排除纯付费工具
    is_fully_paid = tool.get('is_pay') == '1'
    if is_fully_paid:
        remark = tool.get('pay_remark', '').lower()
        if 'free' not in remark and 'trial' not in remark and 'freemium' not in remark:
             return False, "purely_paid" 

    # 通过了所有极高门槛
    return True, "passed"

def quality_based_clean(input_file: str, output_file: str):
    print(f"📂 正在读取第二次清洗结果: {input_file}")
    
    if not os.path.exists(input_file):
        print(f"❌ 错误: 找不到文件 {input_file}。请确保文件路径正确。")
        return

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ 错误: 文件 {input_file} 格式损坏。{e}")
        return

    total_count = len(data)
    
    print(f"🔢 筛选前数据量: {total_count} 条")
    print(f"🔥 启动基于域名信任度的极高品质筛选 (边筛选边存储到临时文件: {TEMP_STREAM_FILE})...")

    success_count = 0
    failure_reasons = {} # 追踪失败原因
    
    # --- 步骤 1: 边筛选边存储到 JSON Lines 临时文件 ---
    with open(TEMP_STREAM_FILE, 'w', encoding='utf-8') as temp_f:
        # 使用 tqdm 包装 data，并在 desc 中显示当前等待时间
        for tool in tqdm(data, desc=f"Checking domain authority (Wait: {MIN_WAIT_SECONDS}-{MAX_WAIT_SECONDS}s)"):
            passed, reason = is_ultra_high_quality(tool) # 调用更新后的函数
            
            if passed:
                # 筛选通过，立即写入
                json_line = json.dumps(tool, ensure_ascii=False)
                temp_f.write(json_line + '\n')
                temp_f.flush()
                success_count += 1
            else:
                # 追踪失败原因
                failure_reasons[reason] = failure_reasons.get(reason, 0) + 1


    # --- 步骤 2: 将 JSON Lines 临时文件转回 JSON 数组并写入最终文件 ---
    final_tools: List[Dict] = []
    if os.path.exists(TEMP_STREAM_FILE):
        with open(TEMP_STREAM_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    final_tools.append(json.loads(line))
    
    final_count = len(final_tools)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_tools, f, ensure_ascii=False, indent=2)

    # 打印报告
    print("\n" + "="*40)
    print("🚀 最终质量筛选报告 (V3 - 解决 WHOIS 超时)")
    print("="*40)
    print(f"描述长度要求: **已取消**")
    print(f"最低域名年龄要求: {MIN_DOMAIN_AGE_YEARS} 年")
    print(f"最低分类数量要求: {MIN_CATEGORIES} 个")
    print("-" * 40)
    print(f"📥 筛选前数据量: {total_count} 条")
    print(f"✅ 最终保留精品: {final_count} 条 (实时写入成功 {success_count} 条)")
    print(f"🗑️  本次剔除数量: {total_count - final_count} 条")
    print("-" * 40)
    print("❌ 失败原因分布:")
    for r, count in failure_reasons.items():
        print(f"   - {r}: {count} 条")
    print("="*40)
    print(f"💾 最终精品数据已保存至: {output_file}")
    print(f"💾 临时流式文件已保存至: {TEMP_STREAM_FILE}")

if __name__ == "__main__":
    quality_based_clean(INPUT_FILE, OUTPUT_FILE)