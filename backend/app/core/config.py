# backend/app/core/config.py
from pydantic import Field
from pydantic_settings import BaseSettings

# 注意：在生产环境中，这些敏感信息应通过环境变量读取，
# 这里为方便快速启动，我们使用默认值。

class Settings(BaseSettings):
    # --- 数据库配置 ---
    # 本地开发使用 PostgreSQL（与生产环境一致）
    # 格式：postgresql://用户名:密码@主机:端口/数据库名
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/aitools", 
        env='DATABASE_URL',
        description="PostgreSQL 数据库连接 URL"
    )

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

    class Config:
        env_file = ".env" # 如果使用 .env 文件，需要安装 python-dotenv

settings = Settings()