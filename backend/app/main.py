from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # 导入 CORS 中间件
from fastapi.staticfiles import StaticFiles # 导入静态文件服务
from contextlib import asynccontextmanager
from pathlib import Path
from app.core.db import create_db_and_tables 
from app.api.endpoints import tools, auth, admin, seo, workflow_templates
from app.core.config import settings
from app.models.workflow_template import WorkflowTemplate, WorkflowNode # 新增导入
from app.models.user import User # 新增导入 User 模型
from app.models.category_mapping import CategoryMapping  # ensure table is created on startup

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Application startup event: Creating database tables...")
    create_db_and_tables() 
    yield

app = FastAPI(
    title="AI Tools Aggregator Backend API",
    version="0.1.0",
    description="RESTful API for managing AI tools, users, and comments.",
    lifespan=lifespan
)

# ----------------------------------------------------
# CORS 配置：允许前端域访问
# ----------------------------------------------------
import os

# 从环境变量读取允许的域名，支持多个域名用逗号分隔
cors_origins_env = os.getenv("CORS_ORIGINS", "")
origins = [
    "https://aicollection.tools", # 您的前端生产域名
    "http://localhost:5173",  # Vite 前端开发服务器
    "http://127.0.0.1:5173",
]

# 添加生产环境域名（从环境变量读取）
if cors_origins_env:
    production_origins = [origin.strip() for origin in cors_origins_env.split(",")]
    origins.extend(production_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # 允许的域列表
    allow_credentials=True,         # 允许携带 Cookie
    allow_methods=["*"],            # 允许所有 HTTP 方法 (GET, POST, etc.)
    allow_headers=["*"],            # 允许所有请求头
)
# ----------------------------------------------------

# 挂载静态文件目录
static_dir = Path("static")
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", tags=["Status"])
def read_root():
    """
    健康检查路由，返回API状态。
    """
    return {"status": "ok", "message": "AI Tools Aggregator API is running"}

# 注册工具 API 路由
app.include_router(tools.router, prefix=settings.API_V1_STR, tags=["tools"])

# 注册认证 API 路由
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["auth"])

# 注册管理员 API 路由
app.include_router(admin.router, prefix=settings.API_V1_STR, tags=["admin"])

# 注册 SEO API 路由
app.include_router(seo.router, prefix=settings.API_V1_STR, tags=["seo"])

# 注册工作流模板 API 路由
app.include_router(workflow_templates.router, prefix=settings.API_V1_STR, tags=["workflow_templates"])