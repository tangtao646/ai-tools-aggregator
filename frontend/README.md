# 🚀 AI Tools Aggregator (全栈 Web 项目)

本项目是一个基于 React (Vite) / TailwindCSS 和 Python (FastAPI) 的 AI 工具汇总网站。

## ⚙️ 技术栈

* **前端:** React 18, Vite, TailwindCSS, Axios
* **后端:** Python 3.10+, FastAPI, SQLModel
* **数据库:** SQLite (开发环境), PostgreSQL (推荐生产环境)

---

## 🛠️ 本地开发环境设置

### 1. 后端 (FastAPI + Python)

**前提:** 确保已安装 Python 3.9+ 和 pip。

1.  **进入后端目录:**
    ```bash
    cd backend
    ```

2.  **创建虚拟环境并激活:** (推荐做法)
    ```bash
    python -m venv venv
    source venv/bin/activate  # macOS/Linux
    # venv\Scripts\activate   # Windows
    ```

3.  **安装依赖:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **启动后端 API 服务器 (带热重载):**
    ```bash
    # 默认使用 SQLite 数据库文件 aitools.db
    uvicorn app.main:app --reload
    ```
    * **访问 API 文档:** 服务器启动后，访问 `http://127.0.0.1:8000/docs` 进行接口测试。

### 2. 前端 (React + Vite)

**前提:** 确保已安装 Node.js (v16+) 和 npm/yarn/pnpm。

1.  **进入前端目录:**
    ```bash
    cd frontend
    ```

2.  **安装依赖:**
    ```bash
    npm install  # 或 yarn install / pnpm install
    ```

3.  **启动前端开发服务器:**
    ```bash
    npm run dev
    ```
    * **访问应用:** 浏览器会自动打开或访问命令行提示的地址 (通常是 `http://localhost:5173/`)。

---

## 📦 部署指南 (生产环境)

### 1. 后端生产环境部署

我们推荐使用 Docker 或云服务 (如 Render, Heroku) 部署 FastAPI，并使用 Gunicorn 或 Uvicorn Manager 作为生产级 ASGI 服务器。

1.  **切换至 PostgreSQL:**
    * 在服务器上安装并配置 PostgreSQL。
    * 在 `backend` 目录下创建 `.env` 文件，用于设置生产环境的数据库连接字符串。

    ```dotenv
    # backend/.env (生产环境配置)
    DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db_name>"
    ```

2.  **生产启动命令 (使用 Gunicorn 和 Uvicorn Worker):**
    * 首先安装 Gunicorn (如果使用 Linux/Unix 环境): `pip install gunicorn`
    * **启动命令:** ```bash
        gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
        ```
        *说明：`-w 4` 使用 4 个 worker 进程来处理请求，提高并发性能。*

### 2. 前端生产环境打包与发布

前端是纯静态文件，可以部署到任何静态文件托管服务（如 Netlify, Vercel, Nginx, CDN）。

1.  **打包命令:**
    ```bash
    cd frontend
    npm run build
    ```
    这将在 `frontend/dist` 目录下生成所有压缩、优化的静态文件。

2.  **发布:**
    将 `frontend/dist` 目录下的所有内容上传到您的 Web 服务器或静态托管平台。

---

## ❌ 常见环境报错处理

| 错误描述 | 可能原因 | 解决方案 |
| :--- | :--- | :--- |
| `psycopg2.OperationalError: connection refused` | PostgreSQL 服务未运行或连接参数错误。 | 检查 `DATABASE_URL`，确认 PostgreSQL 服务是否启动，并检查防火墙端口 (默认 5432)。 |
| `Application startup failed. Exiting.` | 数据库初始化时连接失败。 | 确认数据库凭证正确。开发初期可暂时使用 **SQLite** (`sqlite:///./aitools.db`) 进行调试。 |
| `ModuleNotFoundError` | Python 依赖缺失。 | 确保在 `backend` 目录下执行了 `pip install -r requirements.txt`。 |
| `Failed to fetch` / CORS 错误 (前端) | 前端和后端运行在不同端口，浏览器阻止了跨域请求。 | **后端修正:** 在 `backend/app/main.py` 中添加 CORS 中间件，允许前端域访问（例如：`http://localhost:5173`）。 |
| `TailwindCSS styles not applied` | Tailwind 配置未正确扫描文件。 | 检查 `frontend/tailwind.config.js` 中的 `content` 路径是否正确 (`./src/**/*.{js,ts,jsx,tsx}`)。 |

---