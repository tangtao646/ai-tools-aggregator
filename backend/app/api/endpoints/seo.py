# backend/app/api/endpoints/seo.py
from fastapi import APIRouter, Depends, Response
from sqlmodel import Session, select
from datetime import datetime
from app.core.db import get_session
from app.models.tool import Tool, ReviewStatus

router = APIRouter(
    prefix="/seo",
    tags=["SEO"]
)

@router.get("/sitemap.xml", response_class=Response)
def get_sitemap(db: Session = Depends(get_session)):
    """
    生成动态 sitemap.xml
    包含所有已发布的工具页面
    """
    # 获取所有已发布的工具
    statement = select(Tool).where(Tool.review_status == ReviewStatus.PUBLISHED)
    tools = db.exec(statement).all()
    
    # 生成 sitemap XML
    xml_content = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    # 首页
    xml_content += '  <url>\n'
    xml_content += '    <loc>https://yourdomain.com/</loc>\n'
    xml_content += f'    <lastmod>{datetime.utcnow().strftime("%Y-%m-%d")}</lastmod>\n'
    xml_content += '    <changefreq>daily</changefreq>\n'
    xml_content += '    <priority>1.0</priority>\n'
    xml_content += '  </url>\n'
    
    # 每个工具页面
    for tool in tools:
        xml_content += '  <url>\n'
        xml_content += f'    <loc>https://yourdomain.com/tool/{tool.slug}</loc>\n'
        xml_content += f'    <lastmod>{tool.updated_at.strftime("%Y-%m-%d")}</lastmod>\n'
        xml_content += '    <changefreq>weekly</changefreq>\n'
        xml_content += '    <priority>0.8</priority>\n'
        xml_content += '  </url>\n'
    
    xml_content += '</urlset>'
    
    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={"Content-Disposition": "inline; filename=sitemap.xml"}
    )


@router.get("/robots.txt", response_class=Response)
def get_robots():
    """
    生成 robots.txt
    指引搜索引擎爬虫
    """
    robots_content = """User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /my-submissions

# Sitemap
Sitemap: https://yourdomain.com/api/v1/seo/sitemap.xml

# Crawl-delay (optional, in seconds)
Crawl-delay: 1
"""
    
    return Response(
        content=robots_content,
        media_type="text/plain",
        headers={"Content-Disposition": "inline; filename=robots.txt"}
    )
