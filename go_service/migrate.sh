#!/bin/bash
# 文件名: migrate.sh

echo "Starting database migration process..."

# 1. 在 Railway 环境中安装 golang-migrate CLI
# 这一步确保在 Railway 的部署环境中，migrate 工具是可用的。
go install github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# 2. 检查 Railway 提供的数据库连接字符串（$DATABASE_URL）
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set by Railway."
    exit 1
fi

# 3. 执行迁移操作
# 使用 go install 后的工具路径运行 migrate up
# 注意：在大多数 Railway/Linux 容器中，go install的路径是 /root/go/bin/
/root/go/bin/migrate -path db/migrations -database "$DATABASE_URL" up

# 4. 检查迁移结果，如果失败，则停止部署
if [ $? -ne 0 ]; then
    echo "Database migration failed! Deployment aborted."
    exit 1
fi

echo "Database migrations completed successfully."