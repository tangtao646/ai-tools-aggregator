import requests
import json
import time
import random
import os
from datetime import datetime

# --- 配置 ---
BASE_URL = "https://www.aitoolhub.net/gpt/search"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.aitoolhub.net/gpt/"
}
OUTPUT_FILE = "aitoolhub_shallow_data.json"
TOOLS_PER_PAGE = 36 # 目标网站每页显示工具数量

# --- 核心函数 ---

def load_existing_data():
    """尝试加载已有的数据，实现断点续传"""
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                total_tools = len(data)
                # 计算下一页的页码 (向上取整)
                start_page = (total_tools // TOOLS_PER_PAGE) + 1
                
                print(f"💾 发现历史数据文件，共 {total_tools} 条记录。")
                print(f"▶️ 将从第 {start_page} 页开始继续抓取...")
                return data, start_page
            except json.JSONDecodeError:
                print("❌ 历史文件损坏，从头开始。")
                return [], 1
    return [], 1

def save_data(data):
    """将数据保存为 JSON 文件"""
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] 💾 当前进度已保存 ({len(data)} 条记录).")

def fetch_all_tools(start_page):
    all_tools_data, current_page = load_existing_data()
    
    if start_page > current_page:
        current_page = start_page

    print("🚀 开始 API 批量抓取...")
    
    API_PARAMS = {"lg": "en", "json": 1, "page": current_page}

    while True:
        API_PARAMS["page"] = current_page
        
        try:
            # 1. 发送请求
            response = requests.get(BASE_URL, params=API_PARAMS, headers=HEADERS, timeout=30)
            response.raise_for_status() 

            # 2. 检查反爬状态码 (429 Too Many Requests, 403 Forbidden)
            if response.status_code in [429, 403]:
                raise Exception(f"Potential block detected (Status: {response.status_code})")
            
            # 3. 解析 JSON 数据
            data = response.json()
            tools_on_page = data.get('list', [])

            if not tools_on_page:
                print(f"✅ 第 {current_page} 页列表为空，抓取完成！")
                break
            
            # 4. 【关键修改】直接保留整个原始工具 JSON 对象
            for tool in tools_on_page:
                all_tools_data.append(tool)
            # -----------------------------------------------
            
            print(f"📜 成功抓取第 {current_page} 页，当前累计工具数: {len(all_tools_data)}")

            # 5. 检查断点：每抓取 50 页进行一次长时间休息
            if current_page % 50 == 0:
                cooldown_minutes = 2
                print(f"\n--- 达到断点 {current_page} 页，休息 {cooldown_minutes} 分钟 ---")
                save_data(all_tools_data) 
                time.sleep(cooldown_minutes * 60)
                print(f"--- 休息结束，从第 {current_page + 1} 页继续 ---")
            
            # 6. 页码递增和礼貌性延迟 (3到6秒)
            current_page += 1
            time.sleep(random.uniform(3.0, 6.0)) 

        except requests.exceptions.HTTPError as e:
            if response.status_code in [429, 403]:
                cooldown_minutes = 45
                print(f"🔴 警报！IP 可能被临时封锁。休息 {cooldown_minutes} 分钟。")
                save_data(all_tools_data)
                time.sleep(cooldown_minutes * 60)
                page -= 1
                continue
            else:
                print(f"❌ HTTP 错误在第 {current_page} 页: {e}. 停止抓取。")
                break
        except requests.exceptions.RequestException as e:
            # 其他网络或请求错误
            print(f"⚠️ 请求失败或网络错误在第 {current_page} 页: {e}. 正在重试...")
            time.sleep(5) 
        except json.JSONDecodeError:
            print(f"⚠️ JSON 解析失败在第 {current_page} 页。")
            time.sleep(5) 
            
    return all_tools_data


if __name__ == "__main__":
    # 启动时，load_existing_data() 会自动加载历史数据并确定起始页码
    tools, start_page = load_existing_data()
    
    # 无论加载成功与否，都从确定的起始页码开始抓取
    final_tools_list = fetch_all_tools(start_page)
    
    if final_tools_list:
        save_data(final_tools_list)
    else:
        print("没有抓取到任何新数据。")