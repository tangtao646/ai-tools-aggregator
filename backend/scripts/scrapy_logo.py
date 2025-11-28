import json
import asyncio
import os
import re
from urllib.parse import urljoin, urlparse
from playwright.async_api import async_playwright

# --- 配置 ---
INPUT_FILE = 'failed3_logos.json'
SUCCESS_OUTPUT_FILE = 'success_logos.json'  # 成功存储文件
FAILED_OUTPUT_FILE = 'failed4_logos.json'    # 失败存储文件

# 定义高质量格式后缀
HIGH_QUALITY_FORMATS = ('.png', '.jpg', '.jpeg', '.webp', '.svg','.ico','.gif') 
# 排除 .svg，因为您明确要求只保留点阵图格式 (.svg 是矢量图)
# 排除 .ico，因为这是低质量格式


# --- 辅助函数：格式检查 ---

def is_hq_format(url):
    """
    检查 URL 结尾是否为指定的高质量格式 (.png, .jpg, .jpeg, .webp)。
    """
    if not url:
        return False
    # 分割 URL 路径和查询参数，只检查路径部分的后缀
    path = urlparse(url).path.lower()
    return path.endswith(HIGH_QUALITY_FORMATS)

# --- 辅助函数：图标提取 (使用更具容错性的正则表达式) ---

def extract_icon_from_html(html_content, base_url):
    """
    尝试从 HTML 中提取图标链接，优先级：apple-touch-icon > PNG/JPG/SVG/WEBP (大尺寸)。
    使用不依赖属性顺序的正则表达式来匹配 <link> 标签。
    """
    
    # 匹配所有的 <link ... > 标签
    pattern_link = re.compile(
        r'<link\s+(?P<attributes>[^>]+)>', 
        re.IGNORECASE | re.DOTALL
    )
    
    # 1. 最高优先级：查找 apple-touch-icon
    for match in pattern_link.finditer(html_content):
        attributes = match.group('attributes')
        if re.search(r'rel=["\'][^"\']*apple-touch-icon[^"\']*["\']', attributes, re.IGNORECASE):
            href_match = re.search(r'href=["\'](.*?)["\']', attributes, re.IGNORECASE)
            if href_match:
                try:
                    return urljoin(base_url, href_match.group(1))
                except Exception:
                    continue

    # 2. 次要优先级：复杂筛选 rel="icon" 或 rel="shortcut icon" 链接
    candidate_icons = []
    
    # 允许的常见图标后缀，包括低质量的 ico 和矢量 svg，以便进行尺寸筛选
    ALL_COMMON_FORMATS = HIGH_QUALITY_FORMATS + ('.ico', '.svg', '.jpeg')

    for match in pattern_link.finditer(html_content):
        attributes = match.group('attributes')
        
        if re.search(r'rel=["\'][^"\']*icon[^"\']*["\']', attributes, re.IGNORECASE):
            
            sizes_match = re.search(r'sizes=["\']?([^\s"\']*)["\']?', attributes, re.IGNORECASE)
            href_match = re.search(r'href=["\'](.*?)["\']', attributes, re.IGNORECASE)
            
            if not href_match:
                continue
                
            href = href_match.group(1)
            sizes_attr = sizes_match.group(1) if sizes_match else None

            try:
                size = 0
                if sizes_attr and 'x' in sizes_attr:
                    size_str = sizes_attr.split(' ')[0].split('x')[0]
                    size = int(size_str)
                
                absolute_url = urljoin(base_url, href)
                
                # 在筛选阶段，我们优先选择高清格式，但在存储时才进行严格过滤
                is_hq_format = absolute_url.lower().endswith(HIGH_QUALITY_FORMATS)
                candidate_icons.append((is_hq_format, size, absolute_url))
            except Exception:
                continue

    # 3. 排序和选择
    if candidate_icons:
        candidate_icons.sort(key=lambda x: (x[0], x[1]), reverse=True)
        return candidate_icons[0][2]
        
    return None

# --- 核心 Playwright 抓取函数 (get_logo_url) ---

async def get_logo_url(link):
    """
    使用 Playwright 访问链接，返回提取到的 URL 或 None（如果失败）。
    """
    base_url = urlparse(link).scheme + "://" + urlparse(link).netloc
    
    # 增加超时时间和修改等待策略
    MAX_TIMEOUT = 60000 
    WAIT_UNTIL_STRATEGY = 'domcontentloaded'

    # 使用 Playwright 启动浏览器
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        try:
            await page.goto(
                link, 
                wait_until=WAIT_UNTIL_STRATEGY, 
                timeout=MAX_TIMEOUT
            )
            
            html_content = await page.content()
            logo_url = extract_icon_from_html(html_content, page.url)
            
            if logo_url:
                print(f"   ✅ 提取到链接: {logo_url}")
                return logo_url, "Success" # 返回链接和成功标记

        except Exception as e:
            error_message = f"访问超时或解析异常: {e.__class__.__name__}"
            print(f"   ❌ 访问或解析失败 ({link}): {error_message}")
            return None, error_message # 返回 None 和错误信息

        finally:
            await browser.close()
            
    # 无法通过 Playwright 访问
    return None, f"Playwright 无法访问或提取，尝试默认 favicon"

# --- 增量加载和写入函数 ---

def load_processed_data(file_path):
    """加载已处理的数据，如果文件不存在或为空，则返回空列表。"""
    if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"⚠️ 现有文件 {file_path} 格式损坏。")
    return []

def save_data_incremental(file_path, data):
    """将数据增量写入指定的 JSON 文件。"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# --- 主执行函数 (包含分类存储逻辑) ---

async def main():
    try:
        # 1. 读取所有待处理的 JSON 数据
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            all_tools_data = json.load(f)

        # 2. 尝试加载现有的结果 (用于断点续传)
        successful_data = load_processed_data(SUCCESS_OUTPUT_FILE)
        failed_data = load_processed_data(FAILED_OUTPUT_FILE)
        
        # 将已处理的工具名集合起来
        processed_names = {item['name'] for item in successful_data + failed_data}
        
        tools_to_process = [
            tool for tool in all_tools_data 
            if tool.get('name') not in processed_names
        ]
        
        total_count = len(all_tools_data)
        remaining_count = len(tools_to_process)
        
        if remaining_count == 0:
            print("🎉 所有工具都已处理完成，无需继续。")
            return

        print(f"\n🚀 开始处理。总计 {total_count} 个工具，已跳过 {total_count - remaining_count} 个，待处理 {remaining_count} 个。")
        
        # 4. 逐条处理并分类存储
        for i, tool in enumerate(tools_to_process):
            tool_name = tool.get('name', 'Unknown Name')
            tool_link = tool.get('link')

            if not tool_link:
                continue
            
            # 调用 Playwright 抓取，返回链接和状态/错误信息
            logo_url, status = await get_logo_url(tool_link)

            # 5. ⭐️ 核心逻辑：根据后缀名分类
            if logo_url and is_hq_format(logo_url):
                # 成功数据
                new_item = {"name": tool_name, "logo_url": logo_url}
                successful_data.append(new_item)
                save_data_incremental(SUCCESS_OUTPUT_FILE, successful_data)
                print(f"   ✅ [成功, {i+1}/{remaining_count}] '{tool_name}' 链接已保存到 {SUCCESS_OUTPUT_FILE}")
            else:
                # 失败数据（链接不符合要求或抓取失败）
                
                # 确定失败原因
                if status != "Success":
                    reason = status # Playwright 访问失败等
                elif logo_url:
                    # 抓到了链接，但不符合后缀要求
                    reason = f"后缀名不合格: {os.path.splitext(urlparse(logo_url).path)[1].lower()}"
                else:
                    reason = "未找到任何图标链接"
                    
                new_item = {"name": tool_name, "link": tool_link, "failed_reason": reason, "last_attempted_url": logo_url}
                failed_data.append(new_item)
                save_data_incremental(FAILED_OUTPUT_FILE, failed_data)
                print(f"   ❌ [失败, {i+1}/{remaining_count}] '{tool_name}' (原因: {reason}) 已保存到 {FAILED_OUTPUT_FILE}")


        print(f"\n🎉 所有工具处理完成。结果已分类保存。")

    except FileNotFoundError:
        print(f"致命错误：未找到输入文件 {INPUT_FILE}。请确保文件存在。")
    except json.JSONDecodeError:
        print(f"致命错误：文件 {INPUT_FILE} JSON 格式错误。")
    except Exception as e:
        print(f"发生未知错误: {e}")

if __name__ == "__main__":
    asyncio.run(main())