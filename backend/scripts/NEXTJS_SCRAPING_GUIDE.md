# Next.js 网站爬虫指南

## 🎯 Next.js 反爬虫挑战

Next.js 网站通常采用以下技术，导致传统爬虫失效：

1. **客户端渲染（CSR）** - 内容通过 JavaScript 动态加载
2. **服务端渲染（SSR）** - 初始 HTML 可能不包含完整数据
3. **懒加载** - 图片和内容滚动时才加载
4. **无限滚动** - 需要模拟滚动才能加载更多
5. **反爬虫检测** - 检测 User-Agent、webdriver 属性

## ✅ 解决方案

### 方案一：使用 Selenium（推荐）

**优点：**
- ✅ 完全模拟真实浏览器行为
- ✅ 自动执行 JavaScript
- ✅ 支持滚动、点击等交互
- ✅ 反检测机制完善

**缺点：**
- ❌ 速度较慢
- ❌ 资源消耗大

### 方案二：使用 Playwright（高级）

**优点：**
- ✅ 比 Selenium 更快
- ✅ 更好的反检测能力
- ✅ 支持多浏览器

**缺点：**
- ❌ 学习成本高

### 方案三：API 抓取（最优）

**优点：**
- ✅ 速度最快
- ✅ 资源消耗低
- ✅ 数据结构清晰

**缺点：**
- ❌ 需要逆向分析 API
- ❌ 可能有反爬虫验证

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
pip install selenium webdriver-manager
```

### 2. 使用 NextJSScraper

```python
from scraper import NextJSScraper

# 创建爬虫实例
scraper = NextJSScraper("https://example-nextjs-site.com")

# 爬取数据
tools = scraper.scrape(max_pages=3)

# 保存结果
scraper.save_to_json(tools, "nextjs_tools.json")
```

### 3. 自定义选择器

根据目标网站的 HTML 结构调整选择器：

```python
class CustomNextJSScraper(NextJSScraper):
    def extract_tools(self, soup):
        tools = []
        
        # 使用目标网站的实际选择器
        cards = soup.select('div[class*="ToolCard"]')
        
        for card in cards:
            tool = {
                'name': card.select_one('h3.title').text.strip(),
                'description': card.select_one('p.description').text.strip(),
                'official_link': card.select_one('a')['href'],
                # ... 更多字段
            }
            tools.append(tool)
        
        return tools
```

## 🔍 如何找到正确的选择器

### 方法 1: 浏览器开发者工具

1. 打开目标网站
2. 按 F12 打开开发者工具
3. 点击 Elements 标签
4. 使用选择器工具（Ctrl+Shift+C）
5. 点击想要抓取的元素
6. 查看元素的 class、id、data-* 属性

### 方法 2: 使用 Selenium 调试

```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
# 不使用无头模式，可以看到浏览器窗口
# options.add_argument('--headless')

driver = webdriver.Chrome(options=options)
driver.get("https://target-site.com")

# 暂停，手动查看页面结构
input("Press Enter to continue...")

# 获取 HTML
html = driver.page_source
print(html)
```

### 方法 3: 分析 Network 请求

1. 打开开发者工具 → Network 标签
2. 刷新页面
3. 查找 XHR/Fetch 请求
4. 找到返回 JSON 数据的 API 请求
5. 直接调用 API（最优方案）

## 🛡️ 反反爬虫技巧

### 1. User-Agent 轮换

```python
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
    # 更多 User-Agent
]

headers = {'User-Agent': random.choice(USER_AGENTS)}
```

### 2. 隐藏 Webdriver 属性

```python
driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
    'source': '''
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        })
    '''
})
```

### 3. 随机延迟

```python
import random
time.sleep(random.uniform(1.5, 3.5))
```

### 4. 模拟人类行为

```python
# 随机滚动
for _ in range(random.randint(3, 6)):
    scroll_height = random.randint(300, 800)
    driver.execute_script(f"window.scrollBy(0, {scroll_height});")
    time.sleep(random.uniform(0.5, 1.5))
```

### 5. 使用代理（可选）

```python
from selenium import webdriver

options = webdriver.ChromeOptions()
options.add_argument('--proxy-server=http://your-proxy:port')
```

## 📊 常见 Next.js 网站示例

### 示例 1: Product Hunt

```python
from scraper import NextJSScraper

scraper = NextJSScraper("https://www.producthunt.com/topics/artificial-intelligence")
scraper.scrape(max_pages=3)
```

### 示例 2: There's An AI For That

```python
class TAIFTScraper(NextJSScraper):
    def extract_tools(self, soup):
        tools = []
        cards = soup.select('[data-testid="ai-tool-card"]')
        
        for card in cards:
            name = card.select_one('h3').text
            desc = card.select_one('.description').text
            link = card.select_one('a')['href']
            
            tools.append({
                'name': name,
                'description': desc,
                'official_link': link,
                'source': 'TAIFT'
            })
        
        return tools
```

### 示例 3: AI Tool Hunt

```python
scraper = NextJSScraper("https://aitoolhunt.com")
tools = scraper.scrape(max_pages=5)
```

## 🐛 常见问题

### 问题 1: `selenium.common.exceptions.WebDriverException`

**原因：** ChromeDriver 未安装或版本不匹配

**解决：**
```bash
pip install webdriver-manager
```

代码中使用自动管理器：
```python
from webdriver_manager.chrome import ChromeDriverManager
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
```

### 问题 2: 爬取到空数据

**原因：**
1. 页面还没加载完成
2. 选择器不正确
3. 内容在 iframe 中

**解决：**
```python
# 增加等待时间
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

wait = WebDriverWait(driver, 10)
element = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "tool-card")))

# 切换到 iframe
driver.switch_to.frame("iframe_id")
```

### 问题 3: 被检测为机器人

**解决：**
1. 使用反检测脚本（已集成）
2. 降低爬取频率（增加 delay）
3. 使用住宅代理 IP
4. 添加 Cookie（模拟登录状态）

### 问题 4: 内存占用过高

**解决：**
```python
# 使用无头模式
options.add_argument('--headless')

# 禁用图片加载
prefs = {"profile.managed_default_content_settings.images": 2}
options.add_experimental_option("prefs", prefs)

# 限制浏览器缓存
options.add_argument('--disk-cache-size=1')
```

## 🎯 最佳实践

### 1. 先分析再编码

```bash
# 使用 curl 测试
curl -H "User-Agent: Mozilla/5.0..." https://target-site.com

# 查看是否需要 JavaScript
curl https://target-site.com | grep -i "tool"
```

### 2. 增量爬取

```python
def scrape_incremental(scraper, last_scraped_id=None):
    tools = scraper.scrape()
    
    # 过滤已爬取的数据
    new_tools = [t for t in tools if t['id'] > last_scraped_id]
    
    return new_tools
```

### 3. 错误重试

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
def fetch_with_retry(url):
    return scraper.fetch_page(url)
```

### 4. 数据验证

```python
def validate_tool(tool):
    required_fields = ['name', 'description', 'official_link']
    return all(field in tool and tool[field] for field in required_fields)

tools = [t for t in scraped_tools if validate_tool(t)]
```

## 🚀 性能优化

### 1. 并行爬取

```python
from concurrent.futures import ThreadPoolExecutor

def scrape_page(page_num):
    scraper = NextJSScraper(base_url)
    return scraper.scrape_page(page_num)

with ThreadPoolExecutor(max_workers=3) as executor:
    results = executor.map(scrape_page, range(1, 6))
```

### 2. 使用 API 代替 Selenium

```python
import requests

# 分析网站找到真实 API
response = requests.get(
    "https://api.example.com/tools",
    params={"page": 1, "limit": 20},
    headers={"User-Agent": "..."}
)
tools = response.json()['data']
```

### 3. 缓存页面

```python
import hashlib
import os

def cache_page(url, html):
    cache_file = f"cache/{hashlib.md5(url.encode()).hexdigest()}.html"
    os.makedirs("cache", exist_ok=True)
    with open(cache_file, 'w') as f:
        f.write(html)

def get_cached_page(url):
    cache_file = f"cache/{hashlib.md5(url.encode()).hexdigest()}.html"
    if os.path.exists(cache_file):
        with open(cache_file, 'r') as f:
            return f.read()
    return None
```

## 📈 监控和日志

```python
import logging

# 配置详细日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# 记录详细信息
logger.info(f"Scraping {url}")
logger.debug(f"Using selector: {selector}")
logger.warning(f"Failed to extract field: {field_name}")
```

## 🎉 总结

针对 Next.js 网站的反爬虫策略：

1. ✅ **使用 Selenium** - 已集成到 `NextJSScraper` 类
2. ✅ **反检测机制** - 隐藏 webdriver 属性
3. ✅ **User-Agent 轮换** - 随机选择 UA
4. ✅ **智能等待** - 等待 JavaScript 渲染完成
5. ✅ **滚动加载** - 支持无限滚动和懒加载
6. ✅ **随机延迟** - 避免被识别为机器人

**推荐流程：**
```
分析网站 → 找到 API（最优）→ 或使用 NextJSScraper → 调整选择器 → 测试验证
```
