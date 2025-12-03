# backend/app/core/config.py
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings,SettingsConfigDict

# 注意：在生产环境中，这些敏感信息应通过环境变量读取，
# 这里为方便快速启动，我们使用默认值。

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra='ignore',
        case_sensitive=True,
    )

    # --- 数据库配置 ---
    # 本地开发使用 PostgreSQL（与生产环境一致）
    # 格式：postgresql://用户名:密码@主机:端口/数据库名
    DATABASE_URL: str = Field(
        default="postgresql://user:db625749TT@postgres:5432/aitools",
        env='DATABASE_URL',
        description="PostgreSQL 数据库连接 URL"
    )

    # --- 环境配置 ---
    # 定义应用运行环境，例如 "development", "staging", "production"
    ENVIRONMENT: str = Field(default="development") 
    
    # --- CORS 配置 ---
    # 生产环境允许的域名，使用逗号分隔的字符串
    PROD_CORS_ORIGINS: str = Field(
        default="https://aicollection.tools"
    )

    # 开发环境允许的域名列表
    DEV_CORS_ORIGINS: List[str] = [
       "http://localhost:5173",  # Vite 前端开发服务器
       "http://127.0.0.1:5173",
    ]

    @property
    def CORS_ORIGINS(self) -> List[str]:
        """根据 ENVIRONMENT 动态生成允许的 CORS 域名列表。"""
        prod_origins = [
            url.strip() for url in self.PROD_CORS_ORIGINS.split(',') if url.strip()
        ]

        if self.ENVIRONMENT == "production" or self.ENVIRONMENT == "staging":
            # 生产或测试环境，只允许生产域名
            return prod_origins
        else:
            # 开发环境，允许生产域名 + 本地开发域名 (防止跨域调试生产 API)
            # 注意：在严格的开发环境中，可能只允许 DEV_CORS_ORIGINS
            return prod_origins + self.DEV_CORS_ORIGINS


    # --- 项目配置 ---
    PROJECT_NAME: str = "AI Tools Aggregator"
    API_V1_STR: str = "/api/v1"
    
    # --- Google OAuth 配置 ---
    GOOGLE_CLIENT_ID: str = Field(
        default="",
        env='GOOGLE_CLIENT_ID',
        description="Google OAuth Client ID"
    )
    GOOGLE_CLIENT_SECRET: str = Field(
        default="",
        env='GOOGLE_CLIENT_SECRET',
        description="Google OAuth Client Secret"
    )
    
    # --- GitHub OAuth 配置 ---
    GITHUB_CLIENT_ID: str = Field(
        default="",
        env='GITHUB_CLIENT_ID',
        description="GitHub OAuth Client ID"
    )
    GITHUB_CLIENT_SECRET: str = Field(
        default="",
        env='GITHUB_CLIENT_SECRET',
        description="GitHub OAuth Client Secret"
    )
    
    # --- JWT 配置 ---
    SECRET_KEY: str = Field(
        default="your-secret-key-change-this-in-production",
        env='SECRET_KEY',
        description="JWT secret key"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Note: model_config above sets env file and extra handling for Pydantic v2

settings = Settings()