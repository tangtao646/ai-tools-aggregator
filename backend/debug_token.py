"""验证 GitHub 登录返回的 Token"""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.auth import create_access_token, verify_token, SECRET_KEY
from datetime import timedelta

# 模拟 GitHub 登录时生成 Token
print("="*60)
print("模拟 GitHub 登录流程")
print("="*60)

user_data = {
    "sub": "taoge646@gmail.com",
    "user_id": 1
}

print(f"1. 用户数据: {user_data}")
print(f"2. SECRET_KEY: {SECRET_KEY}")

# 生成 Token
token = create_access_token(data=user_data, expires_delta=timedelta(hours=24))
print(f"3. 生成的 Token:\n   {token}\n")

# 验证 Token
try:
    payload = verify_token(token)
    print(f"✓ Token 验证成功！")
    print(f"4. 解析的 Payload: {payload}")
except Exception as e:
    print(f"✗ Token 验证失败: {e}")

# 测试前端 Token（从您截图中复制的）
print("\n" + "="*60)
print("验证前端存储的 Token")
print("="*60)

frontend_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0YW9nZTY0NkBnbWFpbC5jb20iLCJ1c2VyX2lkIjoxLCJleHAiOjE3NjM3MDAwNTN9"

print(f"前端 Token (截断): {frontend_token[:50]}...")

try:
    # 注意：这个 Token 可能不完整（因为截图被截断了）
    # 但我们可以尝试验证
    import jwt
    payload = jwt.decode(frontend_token + ".signature", SECRET_KEY, algorithms=["HS256"])
    print(f"✓ 前端 Token 验证成功")
    print(f"Payload: {payload}")
except Exception as e:
    print(f"✗ 前端 Token 验证失败: {e}")
    print(f"   这可能是因为 Token 被截断或签名不匹配")
