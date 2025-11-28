"""创建默认管理员账号"""

import sys
from pathlib import Path

backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.db import get_session
from app.models.admin import Admin
from app.core.auth import hash_password
from sqlmodel import select

def create_default_admin():
    """创建默认管理员账号: admin / admin123"""
    
    # 获取数据库会话
    session = next(get_session())
    
    try:
        # 检查管理员是否已存在
        statement = select(Admin).where(Admin.username == "admin")
        existing_admin = session.exec(statement).first()
        
        if existing_admin:
            print("⚠️  管理员账号已存在")
            print(f"   用户名: {existing_admin.username}")
            return
        
        # 创建新管理员
        hashed_password = hash_password("admin123")
        admin = Admin(
            username="admin",
            hashed_password=hashed_password
        )
        
        session.add(admin)
        session.commit()
        session.refresh(admin)
        
        print("✅ 默认管理员账号创建成功！")
        print(f"   用户名: admin")
        print(f"   密码: admin123")
        print(f"   ID: {admin.id}")
        print(f"\n访问: http://localhost:5173/admin/login")
        
    except Exception as e:
        print(f"❌ 创建管理员失败: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    create_default_admin()
