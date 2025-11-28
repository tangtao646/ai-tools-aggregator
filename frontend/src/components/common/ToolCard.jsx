import React from 'react';
import { useNavigate } from 'react-router-dom';

// 根据设计图，统一付费标签的颜色
const PRICING_COLORS = {
    'Freemium': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    'Paid': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    'Open Source': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    'Free/Open Source': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    'Free': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
};

/**
 * 单个工具卡片组件 - 样式根据设计图调整
 */
const ToolCard = React.memo(({ tool, onNavigateToDetail }) => {
    // 后端返回的字段映射：pricing_model -> pricing, is_featured -> isFeatured
    const pricing = tool.pricing_model || tool.pricing || 'Free';
    const isFeatured = tool.is_featured || tool.isFeatured || false;
    const pricingClasses = PRICING_COLORS[pricing] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';

    const navigate = useNavigate();

    const handleClick = () => {
        if (onNavigateToDetail && typeof onNavigateToDetail === 'function') {
            return onNavigateToDetail(tool.slug || tool.id);
        }
        navigate(`/tool/${tool.slug || tool.id}`);
    };

    return (
        <div 
            className="group relative flex cursor-pointer flex-col rounded-xl border border-gray-200/50 dark:border-gray-500/20 bg-white dark:bg-gray-800/40 p-4 transition-all hover:shadow-glow-primary hover:-translate-y-1 hover:border-primary/50 dark:shadow-inner-glow"
            onClick={handleClick}
        >
            {/* 顶部区域：Logo 和字母标识 */}
            <div className="flex items-start justify-between mb-2.5">
                {/* 工具图标 Logo */}
                {tool.logo_url ? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700/50 flex-shrink-0 p-1">
                        {/* Use object-contain with slight padding so logos scale to fit without being cropped */}
                        <img 
                            src={tool.logo_url.startsWith('http') ? tool.logo_url : `${tool.logo_url}`} 
                            alt={`${tool.name} logo`}
                            className="max-h-full max-w-full object-contain"
                        />
                    </div>
                ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20 text-primary font-bold text-xl flex-shrink-0">
                        {tool.name.charAt(0).toUpperCase()}
                    </div>
                )}
                
                {/* 字母标识 - 右上角小标签 */}
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 font-semibold text-xs">
                    {tool.name.charAt(0).toUpperCase()}
                </div>
            </div>
            
            {/* Content - 左对齐 */}
            <div className="flex flex-col gap-1.5 mb-2.5">
                {/* Name */}
                <p className="text-[#1A202C] dark:text-white text-base font-bold leading-tight truncate">
                    {tool.name}
                </p>
                {/* Category */}
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                    {tool.category}
                </p>
                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 text-sm font-normal leading-relaxed line-clamp-2 min-h-[2.5rem]">
                    {tool.short_description || tool.description}
                </p>
            </div>
            
            {/* Tags - 底部左对齐 */}
            <div className="flex items-center gap-2 flex-wrap mt-auto">
                {/* Featured Tag */}
                {/* {isFeatured && (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/20">
                        Featured
                    </span>
                )} */}
                {/* Pricing Tag */}
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pricingClasses} border ${pricing === 'Freemium' ? 'border-green-200 dark:border-green-500/20' : pricing === 'Paid' ? 'border-red-200 dark:border-red-500/20' : 'border-blue-200 dark:border-blue-500/20'}`}>
                    {pricing}
                </span>
            </div>
            {/* Rating badge - bottom-right */}
            <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-1 text-sm font-semibold text-gray-800 dark:text-gray-100 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.378 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.377 2.455c-.785.57-1.84-.197-1.54-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.628 9.393c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.966z" />
                </svg>
                <span>
                    {typeof tool.rating === 'number' ? tool.rating.toFixed(1) : (tool.rating || '-')}
                </span>
            </div>
        </div>
    );
});

ToolCard.displayName = 'ToolCard';

export default ToolCard;