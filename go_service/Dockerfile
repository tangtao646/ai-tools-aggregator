# -------------------------------------------------------------------------
# 阶段 1: 编译 (BUILDER STAGE)
# -------------------------------------------------------------------------
# 保持使用 golang:1.24-alpine 作为构建环境
FROM golang:1.24-alpine AS builder 

# 设置工作目录
WORKDIR /app

# 复制 go.mod 文件，并下载依赖 (利用缓存层)
COPY go.mod go.sum* ./
RUN go mod download

# 复制源代码
COPY . .

# 编译应用程序
# -o /server: 将二进制文件输出到构建阶段的根目录 (/server)
# -ldflags="-s -w": 移除调试信息，减小最终二进制文件体积 (最佳实践)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/server

# -------------------------------------------------------------------------
# 阶段 2: 运行 (RUNTIME STAGE - 极致小，已集成自签名证书)
# -------------------------------------------------------------------------
# 使用 alpine:3.18 作为基础镜像
FROM alpine:3.18

# 安装 CA 证书和更新工具
RUN apk add --no-cache ca-certificates

# 🎯 关键修改 1: 复制您的自签名证书 (server.crt)
# 假设 server.crt 位于本地 ./backend/go_service 目录下
COPY /certs/server.crt /usr/local/share/ca-certificates/server.crt

# 🎯 关键修改 2: 更新信任链
# 这一步将 server.crt 添加到容器的信任列表中
RUN update-ca-certificates

# 设置应用程序运行目录
WORKDIR /

# 复制编译好的二进制文件
COPY --from=builder /server .

# 暴露端口 (您的服务监听 8000)
EXPOSE 8000

# 🎯 关键修改 3: 简化启动命令，直接运行二进制文件 (不再需要 entrypoint.sh)
CMD ["/server"]