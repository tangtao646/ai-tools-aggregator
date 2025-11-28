import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import Header from '../common/Header.jsx';
import Footer from '../common/Footer.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';

// 导入页面组件
import Home from '../../pages/Home.jsx';
import WorkflowTemplateListPage from "../../pages/WorkflowTemplateListPage.jsx";
import WorkflowTemplateDetailPage from "../../pages/WorkflowTemplateDetailPage.jsx";
import ToolForm from '../../pages/ToolForm.jsx';
import ToolDetail from '../../pages/ToolDetail.jsx';
import Login from '../../pages/Login.jsx';
import AdminLogin from '../../pages/AdminLogin.jsx';
import AdminReview from '../../pages/AdminReview.jsx';
import Datamanager from '../../pages/DataManager.jsx';
import MySubmissions from '../../pages/MySubmissions.jsx';
import TermsOfService from '../../pages/TermsOfService.jsx';
import PrivacyPolicy from '../../pages/PrivacyPolicy.jsx';

const MainLayout = ({ children }) => {
    const { t } = useI18n();
    const location = useLocation();
    const navigate = useNavigate();

    const isHome = location.pathname.endsWith("/");

    // 从 localStorage 初始化深色模式状态
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('ai-tool-hub-dark-mode');
        // 默认设置为 false (浅色模式)
        return savedMode === 'true';
    });

    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        // 检查 localStorage 中是否有 token 来判断登录状态
        const token = localStorage.getItem('token');
        return !!token;
    });

    const [userInfo, setUserInfo] = useState(() => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    });

    const [showUserMenu, setShowUserMenu] = useState(false);

    // 模式切换时更新 localStorage 和 document.documentElement
    useEffect(() => {
        localStorage.setItem('ai-tool-hub-dark-mode', isDarkMode);
        // 直接在 html 标签上添加或移除 dark 类
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // 点击外部关闭用户菜单
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showUserMenu) {
                const userMenuElement = document.getElementById('user-menu-dropdown');
                const avatarButton = document.getElementById('user-avatar-button');

                if (userMenuElement && avatarButton &&
                    !userMenuElement.contains(event.target) &&
                    !avatarButton.contains(event.target)) {
                    setShowUserMenu(false);
                }
            }
        };

        if (showUserMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserMenu]);

    // 模拟导航功能（在 Home.jsx 中点击卡片时触发）
    const navigateToDetail = (name) => {
        navigate(`/tool/${name}`);
    };

    const navigateHome = () => {
        navigate('/');
    };

    // Go back to previous page in history (do not force navigate to home)
    const goBack = () => {
        try {
            // If there's a history entry, go back one step
            if (window.history.length > 1) {
                navigate(-1);
            } else {
                // If no history, just attempt navigate(-1) (no-op in SPA), or keep at current page
                navigate(-1);
            }
        } catch (err) {
            // fallback: do nothing
            console.warn('goBack failed', err);
        }
    };

    const navigateToSubmit = () => {
        navigate('/submit-tool');
    };

    const navigateToLogin = () => {
        navigate('/login');
    };

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        // 从 localStorage 读取用户信息
        const user = localStorage.getItem('user');
        if (user) {
            setUserInfo(JSON.parse(user));
        }
        navigate('/');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUserInfo(null);
        setShowUserMenu(false);
        // 清除 localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const toggleDarkMode = () => {
        setIsDarkMode(prev => !prev);
    };

    // 外部容器的类名，使用 app-container-bg 确保背景色和文本色被正确设置
    const appClass = isDarkMode
        ? "dark app-container-bg"
        : "app-container-bg";

    // 只包含 dark 类，不包含背景样式（用于独立页面）
    const darkModeClass = isDarkMode ? "dark" : "";

    return (
        <div className={`${appClass} min-h-screen flex flex-col`}>
            {/* 顶层布局容器: 使用 flex 列布局并使中间区域可扩展，保证 footer 粘在底部 */}
            <div className="relative flex-1 w-full flex flex-col font-display dark:bg-grid-pattern">

                {/* 参考文件中的径向渐变背景 */}
                <div className="absolute inset-0 top-0 h-[500px] w-full dark:bg-radial-gradient -z-10"></div>

                {/* Sticky Header */}
                {isHome && (
                    <Header
                        isDarkMode={isDarkMode}
                        toggleDarkMode={toggleDarkMode}
                        isAuthenticated={isAuthenticated}
                        navigateToSubmit={navigateToSubmit}
                        userInfo={userInfo}
                        showUserMenu={showUserMenu}
                        setShowUserMenu={setShowUserMenu}
                        handleLogout={handleLogout}
                        navigateToLogin={navigateToLogin}
                    />
                )}

                <main className="flex-grow">
                    <Routes>
                        <Route path="/" element={<Home onNavigateToDetail={navigateToDetail} />} />
                        <Route path="/workflow_templates" element={<WorkflowTemplateListPage />} />
                        <Route path="/workflow_templates/:id" element={<WorkflowTemplateDetailPage />} />
                        <Route path="/submit-tool" element={<ToolForm mode="create" onBack={goBack} />} />
                        <Route path="/edit-tool/:id" element={<ToolForm mode="edit" onBack={goBack} />} />
                        <Route path="/tool/:id" element={<ToolDetail onBack={goBack} />} />
                        <Route path="/login" element={<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}><Login onLoginSuccess={handleLoginSuccess} onBack={goBack} /></GoogleOAuthProvider>} />
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin/review" element={<AdminReview onBack={goBack}/>} />
                        <Route path="/admin/datamanage" element={<Datamanager onBack={goBack}/>} />
                        <Route path="/my-submissions" element={<MySubmissions onBack={goBack} />} />
                        <Route path="/terms" element={<TermsOfService onBack={goBack} />} />
                        <Route path="/privacy" element={<PrivacyPolicy onBack={goBack} />} />
                    </Routes>
                </main>

                <Footer />
            </div>
        </div>
    );
};

export default MainLayout;
