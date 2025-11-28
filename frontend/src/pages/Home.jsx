import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { toolApi } from '../api/apiClient'; // 恢复原始导入
import ToolCard from '../components/common/ToolCard'; // 恢复原始导入
import { CATEGORIES } from '../constants/categories'; // 恢复原始导入
import { useI18n } from '../i18n/I18nContext'; // 恢复原始导入


// --- 辅助组件 ---

/**
 * 筛选按钮组件 - 样式根据设计图 screen.png 调整
 */
const FilterButton = React.memo(({ category, isActive, onClick }) => {
    // 激活状态：背景色为 primary/10, 文本色为 primary (设计图样式)
    const activeClasses = 'bg-primary/10 text-primary font-semibold';
    // 非激活状态：白色背景，深灰/浅灰文本
    const inactiveClasses = 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-[#E2E8F0] dark:border-gray-700 font-medium';

    return (
        <div
            className={`flex h-9 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-4 transition-colors ${isActive ? activeClasses : inactiveClasses}`}
            onClick={() => onClick(category)}
        >
            <p className="text-sm">{category}</p>
        </div>
    );
});


// --- 主组件 ---

const Home = ({ onNavigateToDetail }) => {
    const { t } = useI18n();

    // 状态管理
    const [tools, setTools] = useState([]); // 从后端获取的工具列表
    const [loading, setLoading] = useState(true); // 加载状态
    const [loadingMore, setLoadingMore] = useState(false); // 额外加载状态（滚动触发）
    const [error, setError] = useState(null); // 错误信息
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState(''); // 负责搜索框显示内容
    const [activeCategory, setActiveCategory] = useState('all'); // 改为小写 'all'
    const [pricingModel, setPricingModel] = useState('');
    const [rating, setRating] = useState('');
    const [displayCategories, setDisplayCategories] = useState([]); // 动态分类
    const [catsLoading, setCatsLoading] = useState(true);
    const [catsError, setCatsError] = useState(null);
    const [totalItems, setTotalItems] = useState(0); // 总数据量
    const pageSize = 20; // 每页显示20条
    const offsetRef = useRef(0);
    const hasMoreRef = useRef(true);
    const sentinelRef = useRef(null);

    // 计算总页数（仅用于显示或逻辑判断，如果需要）
    const totalPages = Math.ceil(totalItems / pageSize);

    // Fetch first page or when filters/search change: reset list and offset
    useEffect(() => {
        // Fetch dynamic display categories for the filter bar (only once on mount)
        const fetchCategories = async () => {
            setCatsLoading(true);
            setCatsError(null);
            try {
                const resp = await toolApi.getDisplayCategories();
                const cats = resp.data && resp.data.display_categories ? resp.data.display_categories : [];
                setDisplayCategories(cats);
            } catch (err) {
                console.error('Failed to load display categories', err);
                setCatsError('Failed to load categories');
                // fallback to existing CATEGORIES list if available
                try { setDisplayCategories(CATEGORIES); } catch (e) { setDisplayCategories([]); }
            } finally {
                setCatsLoading(false);
            }
        };
        fetchCategories();

        const resetAndLoad = async () => {
            setLoading(true);
            setError(null);
            offsetRef.current = 0;
            hasMoreRef.current = true;
            // Clear currently displayed items immediately to avoid showing stale results
            setTools([]);
            try {
                const params = {
                    offset: offsetRef.current,
                    limit: pageSize,
                };
                if (activeCategory !== 'all') {
                    // 将首字母大写传给 API (假设这是后端期望的格式)
                    params.category = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
                }
                if (pricingModel) {
                    params.pricing_model = pricingModel;
                }
                if (rating) {
                    params.rating = rating;
                }
                if (searchTerm) params.search = searchTerm;

                const response = await toolApi.getToolsCompact(params);
                const items = response.data.items || [];
                setTools(items);
                setTotalItems(response.data.total || 0);
                offsetRef.current = items.length;
                if (items.length < pageSize || offsetRef.current >= (response.data.total || 0)) {
                    hasMoreRef.current = false;
                }
            } catch (err) {
                console.error('获取工具列表失败:', err);
                setError(t('home.loadError') || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        resetAndLoad();
    }, [activeCategory, searchTerm, pricingModel, rating]);

    const handleSearchChange = (e) => {
        setInputValue(e.target.value);
    };

    /**
     * @function applySearch
     * @description 应用搜索词，并重置所有筛选器到默认状态。
     */
    const applySearch = useCallback(() => {
        // 1. 设置搜索词，触发 useEffect 重新加载
        setSearchTerm(inputValue);

        // 2. 重置所有筛选器为默认值 (保留逻辑)
        if (activeCategory !== 'all') {
            setActiveCategory('all');
        }
        if (pricingModel !== '') {
            setPricingModel('');
        }
        if (rating !== '') {
            setRating('');
        }
    }, [inputValue, activeCategory, pricingModel, rating]);

    const handleClearSearch = useCallback(() => {
        setSearchTerm('');
        setInputValue('');
    }, []);

    // If the user manually clears the input (e.g. backspace to empty),
    // trigger the default reset/load by clearing the active searchTerm.
    const _mountedRef = React.useRef(false);
    React.useEffect(() => {
        if (!_mountedRef.current) {
            _mountedRef.current = true;
            return;
        }

        if (inputValue === '') {
            // apply empty search to reset filters/load default list
            setSearchTerm('');
        }
    }, [inputValue]);

    // 修正点：点击筛选按钮时，同时清空搜索输入框 (inputValue)
    const handleFilterClick = useCallback((category) => {
        setActiveCategory(category.toLowerCase()); // 确保存储为小写，与'all'一致
        setSearchTerm('');
        setInputValue(''); // 新增：清空输入框显示内容
    }, []);

    // 新增：处理 Pricing Model 变更，并清空搜索
    const handlePricingChange = (e) => {
        const value = e.target.value;
        setPricingModel(value);
        // 筛选变更时，清空搜索
        if (searchTerm || inputValue) {
            setSearchTerm('');
            setInputValue('');
        }
    };

    // 新增：处理 Rating 变更，并清空搜索
    const handleRatingChange = (e) => {
        const value = e.target.value;
        setRating(value);
        // 筛选变更时，清空搜索
        if (searchTerm || inputValue) {
            setSearchTerm('');
            setInputValue('');
        }
    };


    // Load more items (called by intersection observer)
    const loadMore = useCallback(async () => {
        if (loadingMore || loading) return;
        if (!hasMoreRef.current) return;
        setLoadingMore(true);
        setError(null);
        try {
            const params = {
                offset: offsetRef.current,
                limit: pageSize,
            };
            if (activeCategory !== 'all') {
                params.category = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
            }
            if (pricingModel) {
                params.pricing_model = pricingModel;
            }
            if (rating) {
                params.rating = rating;
            }
            if (searchTerm) params.search = searchTerm;

            const response = await toolApi.getToolsCompact(params);
            const items = response.data.items || [];
            setTools(prev => [...prev, ...items]);
            setTotalItems(response.data.total || 0);
            offsetRef.current += items.length;
            if (items.length < pageSize || offsetRef.current >= (response.data.total || 0)) {
                hasMoreRef.current = false;
            }
        } catch (err) {
            console.error('加载更多工具失败:', err);
            setError(t('home.loadError') || 'Failed to load more data');
        } finally {
            setLoadingMore(false);
        }
    }, [activeCategory, searchTerm, pricingModel, loading, loadingMore, rating]);

    // 不再需要本地过滤，因为后端API已经处理了筛选和搜索
    const displayTools = tools;

    // 去重：在渲染前移除重复项（优先使用 id 或 slug 判重）
    const uniqueDisplayTools = React.useMemo(() => {
        const seen = new Set();
        const result = [];
        for (const t of displayTools) {
            const key = (t && (t.slug || t.id || JSON.stringify(t)));
            if (!key) {
                // fallback: push if cannot derive key
                result.push(t);
                continue;
            }
            if (seen.has(key)) continue;
            seen.add(key);
            result.push(t);
        }
        return result;
    }, [displayTools]);

    // IntersectionObserver 用于实现滚动到底部自动加载更多
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        // 检查是否有更多数据，如果没有，则不初始化 Observer
        if (!hasMoreRef.current) {
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadMore();
                }
            });
        }, {
            root: null,
            rootMargin: '200px', // 提前加载
            threshold: 0.1
        });

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [loadMore,loading, loadingMore]);
    return (
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">

            {/* 1. Search Bar - 保持原布局，但移除 Shadow-sm 以匹配设计图的轻量感 */}
            <div className="mb-8 flex justify-center">
                <label className="flex flex-col min-w-40 h-14 w-full max-w-[50%]">
                    <div className="flex w-full flex-1 items-stretch rounded-xl h-full bg-white dark:bg-gray-800 border border-[#E2E8F0] dark:border-gray-700 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/50">
                        {/* Search Icon */}
                        <div className="text-gray-400 dark:text-gray-500 flex items-center justify-center pl-5">
                            <span className="material-symbols-outlined">search</span>
                        </div>
                        {/* Input Field and Clear Button */}
                        <input
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-[#1A202C] dark:text-gray-200 focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 text-base font-normal"
                            placeholder={t('home.searchPlaceholder')}
                            value={inputValue}
                            onChange={handleSearchChange}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applySearch(); } }}
                        />
                        {/* Clear Button (only shown when there's input or an active search) */}
                        {(inputValue || searchTerm) && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 flex items-center justify-center pr-3 transition-colors"
                                title={t('home.clear') || 'Clear'}
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        )}
                    </div>
                </label>
            </div>

            {/* 2. Filters - 保持与设计图一致的紧凑布局和 Clear Search 位置 */}
            <div className="flex flex-wrap items-center gap-3 mb-10">
                {/* All Tools Button */}
                <FilterButton
                    category={t('categories.all')}
                    isActive={activeCategory === 'all'}
                    onClick={() => handleFilterClick('all')}
                />

                {/* Dynamic Category Buttons */}
                {catsLoading ? (
                    <div className="flex items-center px-2">
                        <div className="animate-pulse h-9 w-24 bg-gray-100 rounded-full" />
                    </div>
                ) : (
                    displayCategories.map(category => (
                        <FilterButton
                            key={category}
                            category={category}
                            isActive={activeCategory === (category || '').toLowerCase()}
                            onClick={() => handleFilterClick(category)}
                        />
                    ))
                )}

                {/* Pricing Model Dropdown + Rating Filter */}
                <div className="flex items-center ml-2 gap-2">
                    <label className="sr-only">Pricing</label>
                    <select
                        value={pricingModel}
                        onChange={handlePricingChange} // 修正后的处理函数
                        className="h-9 px-3 rounded-full border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
                    >
                        <option value="">{t('home.allPricing') || 'All'}</option>
                        <option value="Free">{t('toolForm.pricingModels.Free') || 'Free'}</option>
                        <option value="Freemium">{t('toolForm.pricingModels.Freemium') || 'Freemium'}</option>
                        <option value="Usage_based">{t('toolForm.pricingModels.Usage_based') || 'Usage-based'}</option>
                        <option value="Subscription">{t('toolForm.pricingModels.Subscription') || 'Subscription'}</option>
                    </select>

                    {/* Rating dropdown: minimum rating filter (4+ etc.) */}
                    <select
                        value={rating}
                        onChange={handleRatingChange} // 修正后的处理函数
                        className="h-9 px-3 rounded-full border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
                    >
                        <option value="">{t('home.ratingAll') || 'All ratings'}</option>
                        <option value="4">{t('home.rating4Plus') || '4+'}</option>
                        <option value="3">{t('home.rating3Plus') || '3+'}</option>
                        <option value="2">{t('home.rating2Plus') || '2+'}</option>
                    </select>
                </div>

                {/* Clear Search Button (Visible when search term exists, positioned on the right) */}
                {/* <div className="flex-grow"></div>
                {searchTerm && (
                    <button 
                        onClick={handleClearSearch} 
                        className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary/90 whitespace-nowrap"
                    >
                        {t('home.clearSearch')}
                    </button>
                )} */}
            </div>

            {/* 3. Tool Grid */}
            {loading ? (
                // 加载状态
                <div className="text-center py-20">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                    <p className="text-xl text-gray-600 dark:text-gray-400">{t('home.loadingTools')}</p>
                </div>
            ) : error ? (
                // 错误状态
                <div className="text-center py-10 text-red-600 dark:text-red-400">
                    <p className="text-xl font-semibold mb-2">{t('home.error')}</p>
                    <p>{error}</p>
                </div>
            ) : displayTools.length > 0 ? (
                // 工具卡片网格 - 响应式：lg及以上5列，md 3列，sm 2列
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
                    {uniqueDisplayTools.map((tool, idx) => (
                        <ToolCard
                            key={tool.slug || tool.id || idx}
                            tool={tool}
                            onNavigateToDetail={onNavigateToDetail}
                        />
                    ))}
                </div>
            ) : (
                // 无数据状态
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <p className="text-xl font-semibold mb-2">{t('home.noToolsFound')}</p>
                    <p>{t('home.tryDifferent')}</p>
                </div>
            )}

            {/* Sentinel: 用于触发自动加载更多 */}
            <div ref={sentinelRef} className="mt-8 h-6"></div>

            {/* 加载更多指示器 */}
            {loadingMore && (
                <div className="text-center py-6">
                    <div className="animate-spin inline-block w-6 h-6 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.loadingMore') || 'Loading more...'}</p>
                </div>
            )}
        </div>
    );
};

export default Home;