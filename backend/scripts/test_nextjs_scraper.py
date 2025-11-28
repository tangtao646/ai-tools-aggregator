#!/usr/bin/env python3
"""
Next.js 网站爬虫测试脚本
快速测试 Selenium 是否正常工作
"""

import sys
from pathlib import Path

# 添加父目录到路径
sys.path.insert(0, str(Path(__file__).parent))

def test_selenium_setup():
    """测试 Selenium 是否正确安装和配置"""
    print("🧪 Testing Selenium Setup...\n")
    
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
        from webdriver_manager.chrome import ChromeDriverManager
        
        print("✅ Selenium packages imported successfully")
        
        # 创建无头浏览器
        options = Options()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        print("🔧 Initializing Chrome WebDriver...")
        driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=options
        )
        
        print("✅ Chrome WebDriver initialized")
        
        # 测试访问网页
        print("🌐 Testing page load...")
        driver.get("https://www.google.com")
        
        title = driver.title
        print(f"✅ Page loaded successfully: {title}")
        
        driver.quit()
        print("\n✅ Selenium setup is working correctly!")
        return True
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("\n💡 Fix: Run 'pip install selenium webdriver-manager'")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n💡 Troubleshooting:")
        print("1. Make sure Chrome browser is installed")
        print("2. Check internet connection")
        print("3. Try running: pip install --upgrade selenium webdriver-manager")
        return False


def test_nextjs_scraper():
    """测试 NextJSScraper 类"""
    print("\n" + "="*60)
    print("🧪 Testing NextJSScraper Class...")
    print("="*60 + "\n")
    
    try:
        from scraper import NextJSScraper
        
        print("✅ NextJSScraper imported successfully")
        
        # 创建爬虫实例（使用一个简单的测试网站）
        test_url = "https://example.com"
        print(f"🔧 Creating scraper for: {test_url}")
        
        scraper = NextJSScraper(test_url, delay=1.0)
        
        if scraper.driver:
            print("✅ Selenium driver initialized in NextJSScraper")
            scraper.driver.quit()
            print("✅ NextJSScraper test passed!")
        else:
            print("⚠️  Selenium driver not initialized (expected if selenium not installed)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def show_usage_example():
    """显示使用示例"""
    print("\n" + "="*60)
    print("📖 Usage Example")
    print("="*60 + "\n")
    
    print("""
# 基础用法（针对 Next.js 网站）
from scraper import NextJSScraper

# 1. 创建爬虫实例
scraper = NextJSScraper("https://example-nextjs-site.com")

# 2. 爬取数据
tools = scraper.scrape(max_pages=3)

# 3. 保存结果
scraper.save_to_json(tools, "nextjs_tools.json")

print(f"Scraped {len(tools)} tools!")


# 高级用法（自定义选择器）
class CustomScraper(NextJSScraper):
    def extract_tools(self, soup):
        tools = []
        
        # 根据目标网站调整选择器
        cards = soup.select('div.tool-card')
        
        for card in cards:
            tool = {
                'name': card.select_one('h3').text.strip(),
                'description': card.select_one('p').text.strip(),
                'official_link': card.select_one('a')['href'],
                'category': 'AI Tools'
            }
            tools.append(tool)
        
        return tools

# 使用自定义爬虫
scraper = CustomScraper("https://your-target-site.com")
tools = scraper.scrape()
""")


def main():
    """主测试流程"""
    print("🚀 Next.js Scraper Test Suite\n")
    
    # 测试 1: Selenium 安装
    selenium_ok = test_selenium_setup()
    
    if not selenium_ok:
        print("\n⚠️  Selenium not properly installed.")
        print("Run: pip install selenium webdriver-manager")
        sys.exit(1)
    
    # 测试 2: NextJSScraper 类
    scraper_ok = test_nextjs_scraper()
    
    if scraper_ok:
        print("\n✅ All tests passed!")
    else:
        print("\n⚠️  Some tests failed. Check errors above.")
    
    # 显示使用示例
    show_usage_example()
    
    print("\n" + "="*60)
    print("💡 Next Steps:")
    print("="*60)
    print("1. Read NEXTJS_SCRAPING_GUIDE.md for detailed instructions")
    print("2. Analyze your target website's HTML structure")
    print("3. Customize the extract_tools() method")
    print("4. Run your scraper and test with small data first")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
