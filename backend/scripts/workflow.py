#!/usr/bin/env python3
"""
Complete Automation Workflow
完整的自动化流程：抓取 → LLM 生成 → 批量导入

使用方法：
    python workflow.py --mode scrape-and-import    # 爬虫 + 导入
    python workflow.py --mode enrich-and-import    # LLM + 导入
    python workflow.py --mode full                 # 完整流程（爬虫 + LLM + 导入）
    python workflow.py --mode test                 # 测试模式（使用示例数据）
"""

import sys
import os
import argparse
import logging
from pathlib import Path
from datetime import datetime

# 添加父目录到路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from scraper import ProductHuntScraper
from content_generator import ContentGenerator
from batch_import import BatchImporter

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AutomationWorkflow:
    """自动化工作流程管理器"""
    
    def __init__(self, output_dir: str = "./data"):
        """
        初始化工作流
        
        Args:
            output_dir: 输出文件目录
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 文件路径
        self.scraped_file = self.output_dir / f"scraped_{self.timestamp}.json"
        self.enriched_file = self.output_dir / f"enriched_{self.timestamp}.json"
    
    def run_scraper(self, max_pages: int = 2) -> str:
        """
        运行爬虫
        
        Args:
            max_pages: 最大爬取页数
            
        Returns:
            输出文件路径
        """
        logger.info("="*60)
        logger.info("STEP 1: Web Scraping")
        logger.info("="*60)
        
        scraper = ProductHuntScraper()
        tools = scraper.scrape(max_pages=max_pages)
        
        if not tools:
            logger.warning("No tools scraped. Aborting workflow.")
            return None
        
        scraper.save_to_json(tools, str(self.scraped_file))
        logger.info(f"✓ Scraped {len(tools)} tools → {self.scraped_file}")
        
        return str(self.scraped_file)
    
    def run_content_generation(self, input_file: str) -> str:
        """
        运行 LLM 内容生成
        
        Args:
            input_file: 输入文件路径
            
        Returns:
            输出文件路径
        """
        logger.info("="*60)
        logger.info("STEP 2: LLM Content Generation (Google Gemini)")
        logger.info("="*60)
        
        # 尝试初始化 ContentGenerator（会自动从环境变量或 config.yaml 读取 API Key）
        try:
            generator = ContentGenerator()
        except ValueError as e:
            logger.error(f"Failed to initialize ContentGenerator: {e}")
            logger.info("Get your free API key at: https://makersuite.google.com/app/apikey")
            logger.info("Set it with: export GOOGLE_API_KEY='your-key-here' or configure in config.yaml")
            return input_file  # 返回原始文件
        
        # 加载工具数据
        import json
        with open(input_file, 'r', encoding='utf-8') as f:
            tools = json.load(f)
        
        # 批量生成
        enriched_tools = generator.batch_generate(tools, delay=1.5)
        
        # 保存结果
        generator.save_to_json(enriched_tools, str(self.enriched_file))
        logger.info(f"✓ Enriched {len(enriched_tools)} tools → {self.enriched_file}")
        
        return str(self.enriched_file)
    
    def run_import(self, input_file: str, auto_approve: bool = False) -> dict:
        """
        运行批量导入
        
        Args:
            input_file: 输入文件路径
            auto_approve: 是否自动审核通过
            
        Returns:
            导入统计信息
        """
        logger.info("="*60)
        logger.info("STEP 3: Batch Import to Database")
        logger.info("="*60)
        
        importer = BatchImporter(auto_approve=auto_approve)
        
        # 加载数据
        tools_data = importer.load_json(input_file)
        
        # 导入
        stats = importer.import_tools(tools_data, skip_duplicates=True)
        
        # 打印统计
        importer.print_stats(stats)
        
        return stats
    
    def run_full_workflow(self, max_pages: int = 2, auto_approve: bool = False):
        """
        运行完整工作流：爬虫 → LLM → 导入
        
        Args:
            max_pages: 爬虫最大页数
            auto_approve: 是否自动审核
        """
        print("\n" + "🚀 "*20)
        print("STARTING FULL AUTOMATION WORKFLOW")
        print("🚀 "*20 + "\n")
        
        # Step 1: 爬虫
        scraped_file = self.run_scraper(max_pages=max_pages)
        if not scraped_file:
            return
        
        # Step 2: LLM 生成
        enriched_file = self.run_content_generation(scraped_file)
        
        # Step 3: 导入
        stats = self.run_import(enriched_file, auto_approve=auto_approve)
        
        print("\n" + "✨ "*20)
        print("WORKFLOW COMPLETED SUCCESSFULLY!")
        print("✨ "*20 + "\n")
        
        return stats


def main():
    """命令行接口"""
    parser = argparse.ArgumentParser(
        description="AI Tools Automation Workflow",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # 完整流程（爬虫 + LLM + 导入）
  python workflow.py --mode full --max-pages 3 --auto-approve
  
  # 仅爬虫 + 导入（跳过 LLM）
  python workflow.py --mode scrape-and-import
  
  # 仅 LLM + 导入（使用已有数据）
  python workflow.py --mode enrich-and-import --input sample_tools.json
  
  # 测试模式（使用示例数据）
  python workflow.py --mode test
        """
    )
    
    parser.add_argument(
        '--mode',
        choices=['full', 'scrape-and-import', 'enrich-and-import', 'test'],
        default='test',
        help="Workflow mode"
    )
    parser.add_argument(
        '--input',
        help="Input file for enrich-and-import mode"
    )
    parser.add_argument(
        '--max-pages',
        type=int,
        default=2,
        help="Maximum pages to scrape (default: 2)"
    )
    parser.add_argument(
        '--auto-approve',
        action='store_true',
        help="Automatically approve tools (set status to PUBLISHED)"
    )
    parser.add_argument(
        '--output-dir',
        default='./data',
        help="Output directory for generated files (default: ./data)"
    )
    
    args = parser.parse_args()
    
    # 创建工作流
    workflow = AutomationWorkflow(output_dir=args.output_dir)
    
    # 执行对应模式
    if args.mode == 'full':
        workflow.run_full_workflow(
            max_pages=args.max_pages,
            auto_approve=args.auto_approve
        )
    
    elif args.mode == 'scrape-and-import':
        scraped_file = workflow.run_scraper(max_pages=args.max_pages)
        if scraped_file:
            workflow.run_import(scraped_file, auto_approve=args.auto_approve)
    
    elif args.mode == 'enrich-and-import':
        if not args.input:
            print("Error: --input required for enrich-and-import mode")
            sys.exit(1)
        
        if not os.path.exists(args.input):
            print(f"Error: Input file not found: {args.input}")
            sys.exit(1)
        
        enriched_file = workflow.run_content_generation(args.input)
        workflow.run_import(enriched_file, auto_approve=args.auto_approve)
    
    elif args.mode == 'test':
        # 测试模式：使用示例数据
        sample_file = Path(__file__).parent / "sample_tools.json"
        
        if not sample_file.exists():
            print(f"Error: Sample file not found: {sample_file}")
            sys.exit(1)
        
        print("\n" + "🧪 "*20)
        print("TEST MODE: Using sample_tools.json")
        print("🧪 "*20 + "\n")
        
        # 选项1: 直接导入（不生成 LLM 内容）
        # workflow.run_import(str(sample_file), auto_approve=args.auto_approve)
        
        # 选项2: 生成 LLM 内容后导入
        enriched_file = workflow.run_content_generation(str(sample_file))
        workflow.run_import(enriched_file, auto_approve=args.auto_approve)


if __name__ == "__main__":
    main()
