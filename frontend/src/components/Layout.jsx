import React from 'react';

// 定义路由常量，供 Layout 中的导航使用
const PAGES = {
  HOME: 'home',
  SUBMIT: 'submit',
  DETAIL: 'detail',
};

/**
 * 全局应用布局组件
 * 包含头部导航 (Header)、主要内容区域和页脚 (Footer)。
 * @param {string} currentPage - 当前页面的名称
 * @param {React.Node} children - 要渲染的页面内容
 * @param {function} onNavigate - 导航函数，用于在不同页面间切换
 */
const Layout = ({ currentPage, children, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans antialiased">
      {/* 头部导航栏 (Header) - 固定在顶部 */}
      <header className="p-4 bg-white shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo/标题 - 点击回到首页 */}
          <button 
            onClick={() => onNavigate(PAGES.HOME)} 
            className="text-2xl font-extrabold text-primary hover:text-indigo-600 transition duration-150 flex items-center group"
          >
            {/* 改进的 Logo 样式 */}
            <span className="text-accent text-3xl mr-2 group-hover:rotate-12 transition duration-300">💡</span>
            AI Tool Hub
          </button>
          
          {/* 导航按钮 */}
          <nav className="flex items-center space-x-6">
             {/* 首页按钮 */}
            <button 
              onClick={() => onNavigate(PAGES.HOME)}
              className={`font-medium py-2 px-3 rounded-lg transition duration-150 text-base
                ${currentPage === PAGES.HOME || currentPage === PAGES.DETAIL // 详情页也高亮列表页
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-600 hover:text-primary hover:bg-indigo-50/50'
                }`
              }
            >
              工具列表
            </button>
            
            {/* 提交工具按钮 */}
            <button
              onClick={() => onNavigate(PAGES.SUBMIT)}
              className={`font-semibold py-2 px-5 rounded-full shadow-md transition duration-200 
                ${currentPage === PAGES.SUBMIT 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                  : 'bg-accent text-white hover:bg-green-600'
                }`
              }
            >
              + 提交工具
            </button>
          </nav>
        </div>
      </header>

      {/* 主要内容区域 - 弹性增长，并设置最大宽度和边距 */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      
      {/* 页脚 (Footer) */}
      <footer className="bg-white border-t border-gray-100 mt-10 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} AI Tool Hub. 基于 React & FastAPI 构建。
          </p>
          <p className="mt-1">
            <a 
              href="javascript:void(0)" 
              onClick={() => onNavigate(PAGES.SUBMIT)} 
              className="hover:text-primary transition duration-150"
            >
              贡献一个工具
            </a> 
            <span className="mx-2 text-gray-300">|</span> 
            <span className="text-gray-400">项目状态: MVP 运行中</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;