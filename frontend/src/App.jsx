import { BrowserRouter } from "react-router-dom";
import MainLayout from "./components/layouts/MainLayout.jsx";
// 导入新的 CSS 文件
import './App.css';

// 这是一个模拟的根组件，用于设置全局样式和包含 Header/Footer，
// 以复刻参考网页的完整布局和颜色主题。


const App = () => {
    return (

        <BrowserRouter>
            <MainLayout />
        </BrowserRouter>

    );
};

export default App;