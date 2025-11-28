import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.core.db import engine
import hashlib


def hash_password(password: str) -> str:
    """使用 SHA256 哈希密码（简化版，生产环境建议使用 bcrypt）"""
    return hashlib.sha256(password.encode()).hexdigest()


def create_admin_table():
    """创建管理员表并插入默认管理员账号"""
    
    with Session(engine) as session:
        # 检查表是否已存在（PostgreSQL 语法）
        result = session.exec(
            text("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='admin'")
        )
        if result.first():
            print("❌ admin 表已存在，跳过创建")
            return
        
        # 创建 admin 表（PostgreSQL 语法）
        create_table_sql = """
        CREATE TABLE admin (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            hashed_password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        """
        session.exec(text(create_table_sql))
        print("✓ 成功创建 admin 表")
        
        # 创建用户名索引
        session.exec(text("CREATE INDEX idx_admin_username ON admin(username);"))
        print("✓ 成功创建 idx_admin_username 索引")
        
        # 插入默认管理员账号
        # 用户名: admin, 密码: admin123 (请在生产环境中修改)
        default_password = "admin123"
        hashed_password = hash_password(default_password)
        
        insert_admin_sql = text("""
        INSERT INTO admin (username, hashed_password, created_at)
        VALUES (:username, :hashed_password, CURRENT_TIMESTAMP);
        """)
        session.execute(insert_admin_sql, {"username": "admin", "hashed_password": hashed_password})
        print("✓ 成功插入默认管理员账号")
        print("  👤 用户名: admin")
        print("  🔑 密码: admin123")
        print("  ⚠️  请在生产环境中立即修改默认密码！")
        
        session.commit()
        print("\n✅ 管理员表创建完成！")


if __name__ == "__main__":
    create_admin_table()
