"""生成测试 Token"""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.auth import create_access_token
from datetime import timedelta
import json

# 模拟您的用户数据
token = create_access_token(
    data={
        'sub': 'taoge646@gmail.com',
        'user_id': 1
    },
    expires_delta=timedelta(hours=24)
)

user_data = {
    "id": 1,
    "email": "taoge646@gmail.com",
    "name": "tangtao646"
}

print("="*60)
print("请在浏览器控制台（F12 → Console）执行以下命令：")
print("="*60)
print(f"localStorage.setItem('token', '{token}');")
print(f"localStorage.setItem('user', '{json.dumps(user_data)}');")
print("location.reload();")
print("="*60)
print("\n执行后刷新页面即可登录！")
