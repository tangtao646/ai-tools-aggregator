# AI Tools Automation Scripts

自动化工具集合，用于批量抓取、生成内容和导入 AI 工具数据。

## 📁 文件结构

```
scripts/
├── scraper.py              # 网页爬虫（抓取 AI 工具目录网站）
├── content_generator.py    # LLM 内容生成器（生成 SEO 内容）
├── batch_import.py         # 批量导入工具（导入到数据库）
├── config.yaml             # 配置文件
└── README.md              # 本文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt

# 如果需要爬取 Next.js 等动态网站，额外安装：
pip install selenium webdriver-manager
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
# Google Gemini API Key（用于内容生成 - 免费！）
GOOGLE_API_KEY=your-google-api-key-here

# 获取免费 API Key: https://makersuite.google.com/app/apikey
# 每天 1,500 次免费请求，无需信用卡

# 数据库连接（已在主配置文件中设置）
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aitools
```

### 3. 配置 config.yaml

编辑 `scripts/config.yaml`，根据需要调整：
- OpenAI 模型选择
- 爬虫目标网站
- 导入默认设置
- 速率限制

## 📖 使用指南

### 方式一：完整自动化流程

从抓取到导入一站式完成：

```bash
# 1. 抓取工具数据
cd backend/scripts
python scraper.py

# 2. 使用 LLM 生成 SEO 内容
python content_generator.py

# 3. 导入到数据库
python batch_import.py enriched_tools.json --auto-approve
```

### 方式二：分步执行

#### Step 1: 网页爬虫

```bash
python scraper.py
```

**功能：**
- 从 Product Hunt、TAAFT 等网站抓取工具信息
- 自动提取：名称、描述、链接、分类
- 输出：`producthunt_tools.json`

**支持 Next.js 网站爬取：**

```bash
# 测试 Selenium 是否正常工作
python test_nextjs_scraper.py

# 使用 Next.js 爬虫
python -c "
from scraper import NextJSScraper

scraper = NextJSScraper('https://nextjs-site.com')
tools = scraper.scrape(max_pages=3)
scraper.save_to_json(tools, 'nextjs_tools.json')
"
```

**自定义爬虫：**

```python
from scraper import GenericAIScraper, NextJSScraper

# 静态网站（使用 requests）
scraper = GenericAIScraper("https://example.com/ai-tools")
tools = scraper.scrape(max_pages=3)
scraper.save_to_json(tools, "custom_tools.json")

# Next.js 动态网站（使用 Selenium）
scraper = NextJSScraper("https://nextjs-site.com/ai-tools")
tools = scraper.scrape(max_pages=3)
scraper.save_to_json(tools, "nextjs_tools.json")
```

#### Step 2: LLM 内容生成

```bash
# 使用默认示例数据
python content_generator.py

# 或读取爬虫数据
python -c "
from content_generator import ContentGenerator
import json

# 加载爬虫数据
with open('producthunt_tools.json') as f:
    tools = json.load(f)

# 生成 SEO 内容（使用 Google Gemini）
generator = ContentGenerator()
enriched = generator.batch_generate(tools, delay=4.0)
generator.save_to_json(enriched, 'enriched_tools.json')
"
```

**生成内容：**
- ✅ `meta_title` - SEO 标题（50-60 字符）
- ✅ `meta_description` - SEO 描述（150-160 字符）
- ✅ `pros` - 优点列表（3-5 条）
- ✅ `cons` - 缺点列表（2-4 条）
- ✅ `faqs` - 常见问题（3-5 个）

**使用 Google Gemini（免费）：**
- 💚 每天 1,500 次免费请求
- ⚡ 速度快，质量优秀
- 📖 详见：`GOOGLE_GEMINI_GUIDE.md`

#### Step 3: 批量导入

```bash
# 导入 JSON 文件（待审核状态）
python batch_import.py enriched_tools.json

# 导入并自动审核通过
python batch_import.py enriched_tools.json --auto-approve

# 允许导入重复项
python batch_import.py enriched_tools.json --allow-duplicates

# 导入 CSV 文件
python batch_import.py tools.csv --format csv
```

**导入统计：**
```
==================================================
IMPORT STATISTICS
==================================================
✓ Successfully imported: 45
⊘ Skipped (duplicates):  5
✗ Failed:                0
Total processed:         50
==================================================
```

## 📊 数据格式

### JSON 格式（推荐）

```json
[
  {
    "name": "ChatGPT",
    "description": "AI-powered conversational agent...",
    "official_link": "https://chat.openai.com",
    "category": "AI Chatbot",
    "pricing_model": "Freemium",
    "tags": ["conversational-ai", "nlp"],
    "meta_title": "ChatGPT - AI Assistant for Everyone",
    "meta_description": "ChatGPT is an advanced AI chatbot...",
    "pros": [
      "Natural conversation",
      "Wide knowledge base"
    ],
    "cons": [
      "May generate inaccurate info",
      "Limited to 2021 knowledge"
    ],
    "faqs": [
      {
        "question": "Is ChatGPT free?",
        "answer": "Yes, ChatGPT offers a free tier..."
      }
    ],
    "rating": 4.5,
    "screenshots": [
      "https://example.com/screenshot1.png"
    ]
  }
]
```

### CSV 格式

```csv
name,description,official_link,category,pricing_model,tags,pros,cons
ChatGPT,"AI chatbot...",https://chat.openai.com,"AI Chatbot",Freemium,"conversational-ai,nlp","Natural conversation,Wide knowledge","May hallucinate,Old knowledge"
```

**注意：** JSON 数组字段（tags, pros, cons, faqs）需用双引号包裹，逗号分隔。

## ⚙️ 高级功能

### 自定义爬虫选择器

修改 `scraper.py` 中的 `extract_tools()` 方法：

```python
class CustomScraper(AIToolScraper):
    def extract_tools(self, soup):
        tools = []
        cards = soup.select('.custom-tool-card')  # 自定义选择器
        
        for card in cards:
            tool = {
                'name': card.select_one('h3').text.strip(),
                'description': card.select_one('.desc').text.strip(),
                # ... 更多字段
            }
            tools.append(tool)
        
        return tools
```

### 自定义 LLM Prompt

编辑 `config.yaml` 中的 `prompts` 部分：

```yaml
prompts:
  meta_title: |
    Your custom prompt for generating SEO titles...
  
  faqs: |
    Generate 5 detailed FAQs about this tool...
```

### 批量导入配置

在 `config.yaml` 中调整：

```yaml
import:
  default_review_status: "PUBLISHED"  # 自动通过审核
  skip_duplicates: false              # 允许重复
  default_category: "AI Tools"        # 默认分类
```

## 🔧 故障排除

### 问题 1: `ImportError: No module named 'bs4'`

**解决：**
```bash
pip install beautifulsoup4 lxml
```

### 问题 2: `OpenAI API key not found`

**已更新为 Google Gemini！**

**解决：**
```bash
# 获取免费 API Key
# 访问：https://makersuite.google.com/app/apikey

# 设置环境变量
export GOOGLE_API_KEY='your-api-key-here'

# 或在 .env 文件中设置
echo "GOOGLE_API_KEY=your-key-here" >> .env
```

**免费额度：**
- ✅ 每天 1,500 次请求
- ✅ 每分钟 15 次请求
- ✅ 完全免费，无需信用卡

### 问题 3: 爬虫返回空数据

**原因：** 网站结构变化，选择器失效，或网站使用 JavaScript 渲染（Next.js, React 等）

**解决：**
```bash
# 1. 检查是否是 JavaScript 渲染的网站
curl https://target-site.com | grep "工具名称"
# 如果找不到内容，说明是客户端渲染

# 2. 使用 Selenium 处理动态网站
pip install selenium webdriver-manager

# 3. 使用 NextJSScraper
python test_nextjs_scraper.py  # 测试 Selenium 是否正常

# 4. 更新选择器
# 使用浏览器开发者工具（F12）查找正确的选择器
# 参考 NEXTJS_SCRAPING_GUIDE.md
```

**调试选择器：**
```python
from selenium import webdriver
driver = webdriver.Chrome()
driver.get("https://target-site.com")

# 在浏览器中手动查看页面结构
input("Press Enter after inspecting...")

# 打印 HTML
print(driver.page_source)
```

### 问题 4: 数据库连接失败

**解决：**
```bash
# 检查 PostgreSQL 是否运行
psql -U postgres -d aitools

# 检查 .env 文件中的 DATABASE_URL
cat ../.env | grep DATABASE_URL
```

## 📈 性能优化

### 1. 速率限制

```yaml
rate_limit:
  openai_requests_per_minute: 50      # OpenAI API 限制
  scraper_requests_per_minute: 30     # 爬虫请求限制
```

### 2. 批量处理

```python
# 分批导入大量数据
import json

with open('large_dataset.json') as f:
    all_tools = json.load(f)

# 每 50 条一批
batch_size = 50
for i in range(0, len(all_tools), batch_size):
    batch = all_tools[i:i+batch_size]
    # 处理批次...
```

### 3. 异步处理（可选）

对于超大数据集，考虑使用 `asyncio` 并发处理：

```python
import asyncio
from content_generator import ContentGenerator

async def generate_async(tool):
    generator = ContentGenerator()
    return generator.generate_seo_content(tool)

# 并发生成
results = await asyncio.gather(*[generate_async(t) for t in tools])
```

## 🎯 最佳实践

### 1. 数据质量检查

导入前检查数据：
```bash
# 验证 JSON 格式
python -m json.tool enriched_tools.json > /dev/null && echo "Valid JSON"

# 统计工具数量
python -c "import json; print(len(json.load(open('enriched_tools.json'))))"
```

### 2. 增量更新

定期更新工具信息：
```bash
# 每周运行一次
0 2 * * 0 cd /path/to/backend/scripts && python scraper.py && python content_generator.py && python batch_import.py enriched_tools.json
```

### 3. 备份数据

导入前备份数据库：
```bash
pg_dump -U postgres aitools > backup_$(date +%Y%m%d).sql
```

## 📚 API 参考

### scraper.py

**类：**
- `AIToolScraper` - 基类
- `ProductHuntScraper` - Product Hunt 爬虫
- `ThereIsAnAIForThatScraper` - TAAFT 爬虫
- `GenericAIScraper` - 通用爬虫

**方法：**
```python
scraper.scrape(max_pages=5)           # 执行爬取
scraper.save_to_json(tools, filename)  # 保存结果
```

### content_generator.py

**类：**
- `ContentGenerator` - LLM 内容生成器

**方法：**
```python
generator.generate_seo_content(tool_data)  # 单个工具
generator.batch_generate(tools)            # 批量生成
generator.save_to_json(tools, filename)    # 保存结果
```

### batch_import.py

**类：**
- `BatchImporter` - 批量导入工具

**方法：**
```python
importer.load_json(filepath)                    # 加载 JSON
importer.load_csv(filepath)                     # 加载 CSV
importer.import_tools(tools, skip_duplicates)   # 导入数据库
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
