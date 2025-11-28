import React from 'react';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { useNavigate } from 'react-router-dom';

const Header = ({ 
    isDarkMode, 
    toggleDarkMode, 
    isAuthenticated, 
    navigateToSubmit, 
    userInfo, 
    showUserMenu, 
    setShowUserMenu, 
    handleLogout, 
    navigateToLogin 
}) => {
    const { t } = useI18n();
    const navigate = useNavigate();

    const navigateHome = () => {
        navigate('/');
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200/10 dark:border-gray-500/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-4 cursor-pointer -ml-20" onClick={navigateHome}>
                        {/* Logo image served from public/logo.png */}
                        <div className="w-8 h-8">
                            <img src="/logo.png" alt={t('common.appName')} className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-[#1A202C] dark:text-white text-xl font-bold">{t('common.appName')}</h1>
                    </div>

                    {/* Navigation & Submit Button */}
                    <div className="flex items-center gap-6 -mr-20">
                        {/* Language Switcher */}
                        <LanguageSwitcher />

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                            title={t('header.toggleDarkMode')}
                        >
                            <span className="material-symbols-outlined">
                                {isDarkMode ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>

                        {/* 根据登录状态显示不同按钮 */}
                        {isAuthenticated ? (
                            <>
                                {/* Submit Button (仅登录用户可见) */}
                                <button
                                    className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-9 px-5 bg-accent text-white text-sm font-bold tracking-wide hover:bg-opacity-90 transition-all shadow-glow-accent hover:shadow-lg hover:shadow-accent/40"
                                    onClick={navigateToSubmit}
                                >
                                    <span className="truncate">{t('header.submitTool')}</span>
                                </button>

                                {/* User Avatar with Dropdown */}
                                <div className="relative">
                                    <button
                                        id="user-avatar-button"
                                        className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                    >
                                        <img
                                            src={userInfo?.avatar || 'https://via.placeholder.com/40'}
                                            alt={userInfo?.name || 'User'}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>

                                    {/* User Menu Modal */}
                                    {showUserMenu && (
                                        <div
                                            id="user-menu-dropdown"
                                            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                                        >
                                            <div className="p-6 flex flex-col items-center space-y-4">
                                                {/* Avatar */}
                                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
                                                    <img
                                                        src={userInfo?.avatar || 'https://via.placeholder.com/64'}
                                                        alt={userInfo?.name || 'User'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                {/* User Name */}
                                                <div className="text-center">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {userInfo?.name || 'User'}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {userInfo?.email || ''}
                                                    </p>
                                                </div>

                                                {/* Menu Items */}
                                                <div className="w-full space-y-2">
                                                    {/* My Submissions */}
                                                    <button
                                                        className="w-full h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                        onClick={() => {
                                                            setShowUserMenu(false);
                                                            navigate('/my-submissions');
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined text-lg">
                                                            history
                                                        </span>
                                                        <span>{t('header.mySubmissions')}</span>
                                                    </button>

                                                    {/* Logout Button */}
                                                    <button
                                                        className="w-full h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                                                        onClick={handleLogout}
                                                    >
                                                        <span className="material-symbols-outlined text-lg">
                                                            logout
                                                        </span>
                                                        <span>{t('header.logout')}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Login Button */}
                                <button
                                    className="h-9 px-4 inline-flex items-center justify-center rounded-full text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-200/60 dark:bg-gray-800/60 hover:bg-gray-200 dark:hover:bg-gray-700/80 transition-colors"
                                    onClick={navigateToLogin}
                                >
                                    <span className="truncate">{t('header.login')}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
