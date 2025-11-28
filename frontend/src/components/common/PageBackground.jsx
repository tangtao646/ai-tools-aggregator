import React from 'react';

/**
 * 页面背景组件 - 统一管理明暗模式背景样式
 * @param {object} props
 * @param {React.ReactNode} props.children - 子元素
 * @param {boolean} props.withGrid - 是否显示网格背景（暗色模式）
 * @param {boolean} props.withGradient - 是否显示渐变效果（暗色模式）
 * @param {string} props.className - 额外的类名
 */
const PageBackground = ({ 
    children, 
    withGrid = true, 
    withGradient = true,
    className = '' 
}) => {
    return (
        <div className={`min-h-screen bg-[#F7F7F9] dark:bg-[#121121] ${className}`}>
            {withGrid && withGradient ? (
                <div className="relative min-h-screen dark:bg-grid-pattern">
                    {/* 径向渐变背景 - 仅暗色模式 */}
                    <div className="absolute inset-0 top-0 h-[500px] w-full dark:bg-radial-gradient -z-10"></div>
                    {children}
                </div>
            ) : withGrid ? (
                <div className="relative min-h-screen dark:bg-grid-pattern">
                    {children}
                </div>
            ) : (
                children
            )}
        </div>
    );
};

export default PageBackground;
