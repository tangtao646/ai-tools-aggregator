// 后端 API 的基础 URL 配置
// 使用 Vite 提供的环境变量进行环境判断。

/**
 * 核心后端基础 URL (不包含 /api/v1)
 * 1. 开发环境 (import.meta.env.DEV 为 true): 使用本地默认地址。
 * 2. 生产环境 (import.meta.env.PROD 为 true): 使用 VITE_API_BASE_URL 注入的地址。
 */
const BASE_URL_CORE = import.meta.env.DEV
    // 开发环境: 使用本地 Go 服务端口
    ? 'http://localhost:8000'
    // 生产环境/测试环境: 依赖于构建时注入的环境变量
    : import.meta.env.VITE_API_BASE_URL; 

/**
 * 完整的 API 基础 URL，包含 API 版本路径。
 * 例如: http://localhost:8000/api/v1 或 https://your-prod-backend.com/api/v1
 */
const BASE_URL = `${BASE_URL_CORE}/api/v1`;

// 如果 BASE_URL_CORE 是未定义或空字符串，这里会是 '/api/v1'，
// 应该添加一个检查以防万一 BASE_URL_CORE 无法被设置
if (!BASE_URL_CORE) {
    console.error("VITE_API_BASE_URL 环境变量未设置，且当前并非开发环境。API 调用将失败!");
    // 可以设置一个安全的默认值，但这通常意味着配置错误
}

export { BASE_URL };