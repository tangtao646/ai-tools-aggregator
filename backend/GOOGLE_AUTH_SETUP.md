# Google OAuth 后端集成指南

## 1. 安装依赖

```bash
cd /Users/tangtao/ai-tools-aggregator/backend
pip install google-auth python-jose[cryptography] passlib[bcrypt] python-multipart
```

## 2. 创建认证端点

在 `backend/app/api/endpoints/` 目录下创建 `auth.py`:

```python
from fastapi import APIRouter, HTTPException, Depends
from google.oauth2 import id_token
from google.auth.transport import requests
from sqlmodel import Session, select
from app.core.db import get_session
from app.models.user import User  # 需要创建 User 模型
from datetime import datetime, timedelta
import os
from jose import jwt

router = APIRouter()

# Google OAuth 配置
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/auth/google")
async def google_login(
    request: dict,
    session: Session = Depends(get_session)
):
    """
    验证 Google OAuth token 并返回 JWT
    """
    try:
        # 验证 Google token
        token = request.get("access_token")
        if not token:
            raise HTTPException(status_code=400, detail="缺少 access_token")
        
        # 使用 Google API 获取用户信息
        import requests as http_requests
        response = http_requests.get(
            "https://www.googleapis.com/oauth2/v1/userinfo",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="无效的 Google token")
        
        user_info = response.json()
        
        # 查找或创建用户
        email = user_info.get("email")
        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()
        
        if not user:
            # 创建新用户
            user = User(
                email=email,
                name=user_info.get("name"),
                avatar=user_info.get("picture"),
                google_id=user_info.get("id"),
                is_active=True
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        
        # 生成 JWT token
        access_token = create_access_token(
            data={"sub": user.email, "user_id": user.id}
        )
        
        return {
            "token": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar": user.avatar
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auth/me")
async def get_current_user(
    # TODO: 添加 JWT token 验证依赖
):
    """
    获取当前登录用户信息
    """
    pass
```

## 3. 创建 User 模型

在 `backend/app/models/` 目录下创建 `user.py`:

```python
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    avatar: Optional[str] = None
    google_id: Optional[str] = Field(default=None, unique=True)
    github_id: Optional[str] = Field(default=None, unique=True)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

## 4. 注册路由

在 `backend/app/main.py` 中添加认证路由:

```python
from app.api.endpoints import auth

app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
```

## 5. 配置环境变量

在 `backend/.env` 文件中添加:

```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
SECRET_KEY=your-secret-key-for-jwt
```

## 6. 数据库迁移

创建 users 表:

```bash
# 如果使用 Alembic
alembic revision --autogenerate -m "Add users table"
alembic upgrade head

# 或者在代码中使用
# SQLModel.metadata.create_all(engine)
```

## 7. Google Cloud Console 配置

1. 访问 https://console.cloud.google.com/
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 客户端 ID:
   - 应用类型: Web 应用
   - 授权的 JavaScript 来源: http://localhost:5173
   - 授权的重定向 URI: http://localhost:5173
5. 复制客户端 ID 到前端 .env 文件和后端 .env 文件

## 测试

启动后端服务器后，前端登录流程:
1. 用户点击 "Continue with Google"
2. Google OAuth 弹窗授权
3. 获取 access_token
4. 发送到 `/api/v1/auth/google`
5. 后端验证并返回 JWT token
6. 前端保存 token 并跳转到首页
