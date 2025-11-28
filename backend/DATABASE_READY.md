# ✅ PostgreSQL 数据库已配置完成

## 当前配置

你的系统已经有一个运行中的 PostgreSQL 容器：

- **容器名称**: `aitools_db`
- **数据库**: `aitools`
- **用户名**: `tangtao`
- **密码**: `123456`
- **端口**: `5432`
- **PostgreSQL 版本**: 14.20

## 连接字符串

```
DATABASE_URL=postgresql://tangtao:123456@localhost:5432/aitools
```

已配置在 `backend/.env` 文件中。

## 数据库状态

✅ 所有迁移已执行完成  
✅ 表结构已创建  
✅ 数据库已就绪

## Docker 容器管理

### 查看容器状态
```bash
/usr/local/bin/docker ps
```

### 停止容器
```bash
/usr/local/bin/docker stop aitools_db
```

### 启动容器
```bash
/usr/local/bin/docker start aitools_db
```

### 查看容器日志
```bash
/usr/local/bin/docker logs aitools_db
```

### 进入数据库
```bash
/usr/local/bin/docker exec -it aitools_db psql -U tangtao -d aitools
```

## 下一步

现在可以启动后端服务了：

```bash
cd /Users/tangtao/ai-tools-aggregator/backend
uvicorn app.main:app --reload
```

访问 API 文档：http://localhost:8000/docs

## 注意事项

- ⚠️  不要删除 `aitools_db` 容器，它包含你的数据
- ⚠️  如果需要重置数据库，可以在容器内执行 SQL
- ✅ 数据库数据持久化在 Docker volume 中，重启不会丢失

## PATH 问题说明

你的系统 PATH 中没有 `/usr/local/bin`，所以需要使用完整路径调用 Docker：

```bash
/usr/local/bin/docker [命令]
```

如需修复，在 `~/.zshrc` 中添加：
```bash
export PATH="/usr/local/bin:$PATH"
```

然后执行 `source ~/.zshrc`
