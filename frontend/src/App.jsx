// frontend/src/App.jsx
import { BrowserRouter } from "react-router-dom";
import MainLayout from "./components/layouts/MainLayout.jsx";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// 导入新的 CSS 文件
import './App.css';

// 创建 QueryClient 实例。在这里设置全局配置。
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // 设置 staleTime 为 1 分钟 (1000ms * 60s * 1m)。
            // 在此时间内，组件重新挂载（如从详情页回退）时，
            // 会立即返回缓存数据，且不会在后台发起新的接口请求。
            // 超过 1 分钟，则会触发后台静默刷新 (Stale-While-Revalidate)。
            staleTime: 1000 * 60 * 1, 
        },
    },
});


const App = () => {
    return (
        // 2. 用 QueryClientProvider 包裹整个应用，使所有组件都能访问 React Query 缓存
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <MainLayout />
            </BrowserRouter>
        </QueryClientProvider>
    );
};

export default App;