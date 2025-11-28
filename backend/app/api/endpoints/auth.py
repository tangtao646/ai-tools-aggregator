from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from app.core.db import get_session
from app.models.user import User
from app.core.config import settings
from app.core.auth import create_access_token  # 使用统一的 Token 生成函数
from datetime import datetime, timedelta
from jose import jwt
import requests as http_requests

router = APIRouter()

@router.post("/auth/google")
async def google_login(
    request: dict,
    session: Session = Depends(get_session)
):
    """
    验证 Google OAuth token 并返回 JWT
    """
    try:
        # 获取 access_token
        token = request.get("access_token")
        if not token:
            raise HTTPException(status_code=400, detail="缺少 access_token")
        
        # 使用 Google API 获取用户信息
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
                name=user_info.get("name", ""),
                avatar=user_info.get("picture"),
                google_id=user_info.get("id"),
                is_active=True
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        else:
            # 更新用户信息
            user.name = user_info.get("name", user.name)
            user.avatar = user_info.get("picture", user.avatar)
            if not user.google_id:
                user.google_id = user_info.get("id")
            user.updated_at = datetime.utcnow()
            session.add(user)
            session.commit()
            session.refresh(user)
        
        # 生成 JWT token
        access_token = create_access_token(
            data={
                "sub": user.email or str(user.id),  # Google 登录一般都有邮箱
                "user_id": user.id
            }
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
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Google login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"登录失败: {str(e)}")

@router.post("/auth/github")
async def github_login(
    request: dict,
    session: Session = Depends(get_session)
):
    """
    验证 GitHub OAuth code 并返回 JWT
    """
    try:
        # 获取 code
        code = request.get("code")
        if not code:
            raise HTTPException(status_code=400, detail="缺少 code")
        
        # 使用 code 换取 access_token
        token_response = http_requests.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=401, detail="无法获取 GitHub access token")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=401, detail="GitHub 返回的 token 无效")
        
        # 使用 access_token 获取用户信息
        user_response = http_requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=401, detail="无法获取 GitHub 用户信息")
        
        user_info = user_response.json()
        
        # 获取用户邮箱（如果公开）
        email = user_info.get("email")
        if not email:
            # 尝试获取主邮箱
            emails_response = http_requests.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if emails_response.status_code == 200:
                emails = emails_response.json()
                primary_email = next((e for e in emails if e.get("primary")), None)
                if primary_email:
                    email = primary_email.get("email")
        
        # GitHub 用户的唯一标识
        github_id = str(user_info.get("id"))
        github_login = user_info.get("login")
        
        # 查找或创建用户（优先使用 github_id 查找）
        statement = select(User).where(User.github_id == github_id)
        user = session.exec(statement).first()
        
        # 如果通过 github_id 找不到，且有邮箱，尝试通过邮箱查找
        if not user and email:
            statement = select(User).where(User.email == email)
            user = session.exec(statement).first()
        
        if not user:
            # 创建新用户（允许邮箱为空）
            user = User(
                email=email,  # 可能为 None
                name=user_info.get("name") or github_login,
                avatar=user_info.get("avatar_url"),
                github_id=github_id,
                is_active=True
            )
            session.add(user)
            session.commit()
            session.refresh(user)
        else:
            # 更新用户信息
            user.name = user_info.get("name") or github_login
            user.avatar = user_info.get("avatar_url", user.avatar)
            if not user.github_id:
                user.github_id = github_id
            # 如果之前没有邮箱，现在有了，就更新
            if not user.email and email:
                user.email = email
            user.updated_at = datetime.utcnow()
            session.add(user)
            session.commit()
            session.refresh(user)
        
        # 生成 JWT token（使用 user_id 作为主键，sub 使用 github_id 或 email）
        jwt_token = create_access_token(
            data={
                "sub": user.email or user.github_id or str(user.id),  # 至少要有一个标识
                "user_id": user.id
            }
        )
        
        print(f"🔐 GitHub 登录成功 - 用户: {user.name} (ID: {user.id})")
        print(f"📧 Email: {user.email}")
        print(f"🆔 GitHub ID: {user.github_id}")
        print(f"🎫 生成的 Token (前50字符): {jwt_token[:50]}...")
        print(f"🔍 Token 长度: {len(jwt_token)}")
        print(f"🔍 Token 点号数量: {jwt_token.count('.')}")
        
        # 立即验证生成的 Token
        try:
            from app.core.auth import verify_token
            payload = verify_token(jwt_token)
            print(f"✓ Token 自验证成功: {payload}")
        except Exception as e:
            print(f"✗ Token 自验证失败: {e}")
        
        return {
            "token": jwt_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar": user.avatar
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"GitHub login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"登录失败: {str(e)}")

@router.get("/auth/me")
async def get_current_user(
    session: Session = Depends(get_session)
):
    """
    获取当前登录用户信息
    TODO: 添加 JWT token 验证
    """
    return {"message": "请实现 JWT token 验证"}