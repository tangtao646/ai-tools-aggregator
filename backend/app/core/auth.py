from datetime import datetime, timedelta
from typing import Optional
import hashlib
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select

from app.core.db import get_session
from app.models.admin import Admin
from app.models.user import User

# JWT 配置
SECRET_KEY = "your-secret-key-change-in-production"  # 生产环境请修改为环境变量
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24小时

# HTTP Bearer 认证
security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)  # 可选认证（不自动抛出错误）


def hash_password(password: str) -> str:
    """使用 SHA256 哈希密码"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return hash_password(plain_password) == hashed_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建 JWT Token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    print(f"🔧 create_access_token 调试:")
    print(f"   输入数据: {data}")
    print(f"   SECRET_KEY (前20字符): {SECRET_KEY[:20]}...")
    print(f"   生成的 Token 类型: {type(encoded_jwt)}")
    print(f"   Token 长度: {len(encoded_jwt) if isinstance(encoded_jwt, str) else 'N/A'}")
    
    return encoded_jwt


def verify_token(token: str) -> dict:
    """验证 JWT Token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"✓ Token 验证成功: {payload}")  # 调试日志
        return payload
    except JWTError as e:
        print(f"✗ Token 验证失败: {type(e).__name__} - {e}")  # 调试日志（显示错误类型）
        print(f"   SECRET_KEY (前20字符): {SECRET_KEY[:20]}...")
        print(f"   ALGORITHM: {ALGORITHM}")
        print(f"   Token (前50字符): {token[:50]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭证",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_session)
) -> Admin:
    """获取当前登录的管理员（依赖注入，用于保护路由）"""
    token = credentials.credentials
    payload = verify_token(token)
    
    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭证"
        )
    
    # 从数据库查询管理员
    statement = select(Admin).where(Admin.username == username)
    admin = db.exec(statement).first()
    
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="管理员不存在"
        )
    
    return admin


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_session)
) -> User:
    """获取当前登录的用户（依赖注入，用于保护需要登录的路由）"""
    token = credentials.credentials
    payload = verify_token(token)
    
    user_id: int = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证凭证"
        )
    
    # 从数据库查询用户
    statement = select(User).where(User.id == user_id)
    user = db.exec(statement).first()
    
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在或已被禁用"
        )
    
    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
    db: Session = Depends(get_session)
) -> Optional[User]:
    """获取当前用户（可选，不强制登录）"""
    if not credentials:
        print("⚠️ get_current_user_optional: 没有提供认证凭证")
        return None
    
    try:
        user = get_current_user(credentials, db)
        print(f"✓ get_current_user_optional: 用户 {user.name} (ID: {user.id}) 认证成功")
        return user
    except HTTPException as e:
        print(f"✗ get_current_user_optional: 认证失败 - {e.detail}")
        return None
