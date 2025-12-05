// frontend/src/pages/Home.jsx
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { toolApi } from '../api/apiClient'; // 恢复原始导入
import ToolCard from '../components/common/ToolCard'; // 恢复原始导入
import { CATEGORIES } from '../constants/categories'; // 恢复原始导入
import { useI18n } from '../i18n/I18nContext'; // 恢复原始导入
// 引入 React Query
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'; 


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
    const { t, locale } = useI18n();
    const pageSize = 20; // 每页显示20条

    // 筛选和搜索状态 (保持不变)
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState(''); // 负责搜索框显示内容
    const [activeCategory, setActiveCategory] = useState('all'); // 'all' or canonical key
    const [pricingModel, setPricingModel] = useState('');
    const [rating, setRating] = useState('');
    
    // 用于无限滚动触发的哨兵引用
    const sentinelRef = useRef(null);
    
    // -----------------------------------------------------------
    // 1. Helpers to normalize and map categories
    // -----------------------------------------------------------

    const canonicalKey = useCallback((cat) => {
        if (!cat) return '';
        const primary = (cat.en && cat.en.trim()) || (cat.zh && cat.zh.trim()) || '';
        return primary.split(/\s+/).join(' ').toLowerCase();
    }, []);
    
    // -----------------------------------------------------------
    // 2. Fetch Dynamic Categories (使用 useQuery)
    // -----------------------------------------------------------
    
    const { 
        data: categoriesData, 
        isLoading: isCategoriesLoading, 
        // 忽略 isError，因为我们总是有 CATEGORIES 作为后备
    } = useQuery({
        // 使用一个稳定的键
        queryKey: ['displayCategories'],
        
        // 实际的 API 调用函数
        queryFn: async () => {
            try {
                const resp = await toolApi.getDisplayCategories();
                // 成功则返回动态列表
                return resp.data && resp.data.display_categories ? resp.data.display_categories : CATEGORIES;
            } catch (err) {
                console.error('Failed to load display categories, falling back to static list.', err);
                // 失败则返回静态后备列表
                return CATEGORIES; 
            }
        },
        // 设置缓存时间：分类很少变化，可以缓存较长时间
        staleTime: 1000 * 60 , // 24小时
        // 使用静态列表作为初始数据，以便在加载前快速渲染 (可选优化)
        placeholderData: CATEGORIES,
    });

    // 派生出 displayCategories 数组，并提供给 findCategoryByLabel
    const displayCategories = useMemo(() => categoriesData || [], [categoriesData]);

    const findCategoryByLabel = useCallback((label) => {
        if (!label) return null;
        const normalized = label.trim().split(/\s+/).join(' ').toLowerCase();
        for (const cat of displayCategories) {
            const en = (cat.en || '').trim().split(/\s+/).join(' ').toLowerCase();
            const zh = (cat.zh || '').trim().split(/\s+/).join(' ').toLowerCase();
            if (en === normalized || zh === normalized) return cat;
        }
        return null;
    }, [displayCategories]);


    // -----------------------------------------------------------
    // 3. React Query Data Fetching (核心变化)
    // -----------------------------------------------------------
    
    // Helper function to build API parameters
    const buildParams = useCallback((offset) => {
        const params = {
            offset: offset,
            limit: pageSize,
            lang_code: locale,
        };

        if (activeCategory !== 'all') {
            const catObj = displayCategories.find(c => canonicalKey(c) === activeCategory);
            // 确保发送正确的本地化分类名称给后端
            params.category = catObj ? (locale === 'zh' ? catObj.zh : catObj.en) || catObj.en || catObj.zh : activeCategory;
        }
        if (pricingModel) params.pricing_model = pricingModel;
        if (rating) params.rating = rating;
        if (searchTerm) params.search = searchTerm;
        return params;
    }, [activeCategory, pricingModel, rating, searchTerm, locale, displayCategories, canonicalKey, pageSize]);

    // 使用 useInfiniteQuery 处理分页、缓存和加载状态
    const {
        data,
        error: toolsError,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage, // 替代 loadingMore
        isLoading, // 替代 loading (首次加载)
        isError,
    } = useInfiniteQuery({
        // Query Key 必须包含所有筛选器/搜索词，以便在它们变化时触发重新获取
        queryKey: ['tools', { activeCategory, searchTerm, pricingModel, rating, locale }],
        
        // 实际的 API 调用函数
        queryFn: async ({ pageParam = 0 }) => {
            // 确保分类数据加载完毕或使用了后备数据才开始加载工具
            // 这里的 isCategoriesLoading 检查是冗余的，因为 buildParams 依赖 categoriesData，
            // 但 React Query 内部的机制会确保在依赖项变化时重新运行 queryFn。
            // 保持此处的代码不变，因为它不会引起错误。

            const params = buildParams(pageParam);
            //console.log('Loading tools with params:', params)
            const response = await toolApi.getToolsCompact(params);
            
            // 返回数据结构，包含下一页的 offset
            return {
                items: response.data.items || [],
                nextOffset: pageParam + (response.data.items || []).length, 
                total: response.data.total || 0,
            };
        },
        
        // 如何获取下一页的参数
        getNextPageParam: (lastPage, allPages) => {
            // 如果获取的条目少于 pageSize，则说明没有更多数据了
            if (lastPage.items.length < pageSize) { 
                return undefined;
            }
            // 返回下一页的 offset
            return lastPage.nextOffset;
        },
        
        // 关键：设置 staleTime，控制组件重新挂载时的刷新行为
        // 1分钟内回退到首页，直接使用缓存，不发请求。超过 1 分钟，静默刷新。
        staleTime: 1000 * 60 * 1, 
        
        // keepPreviousData: true, 
    });


    // 扁平化数据：将分页的数据结构展平为单个数组
    const tools = useMemo(() => {
        return data?.pages?.flatMap(page => page.items) || [];
    }, [data]);
    
    // 去重：在渲染前移除重复项
    const uniqueDisplayTools = useMemo(() => {
        const seen = new Set();
        const result = [];
        for (const t of tools) { 
            const key = (t && (t.slug || t.id || JSON.stringify(t)));
            if (!key) {
                result.push(t);
                continue;
            }
            if (seen.has(key)) continue;
            seen.add(key);
            result.push(t);
        }
        return result;
    }, [tools]);


    // -----------------------------------------------------------
    // 4. Search and Filter Handlers (保持不变，但它们的副作用是改变 Query Key)
    // -----------------------------------------------------------

    const handleSearchChange = (e) => {
        setInputValue(e.target.value);
    };

    /**
     * @function applySearch
     * @description 应用搜索词，并重置所有筛选器到默认状态。
     */
    const applySearch = useCallback(() => {
        // 更改 searchTerm，触发 useInfiniteQuery 重新获取
        setSearchTerm(inputValue);
        
        // 重置所有筛选器为默认值
        if (activeCategory !== 'all') { setActiveCategory('all'); }
        if (pricingModel !== '') { setPricingModel(''); }
        if (rating !== '') { setRating(''); }
    }, [inputValue, activeCategory, pricingModel, rating]);

    const handleClearSearch = useCallback(() => {
        setSearchTerm('');
        setInputValue('');
    }, []);

    const _mountedRef = React.useRef(false);
    React.useEffect(() => {
        if (!_mountedRef.current) {
            _mountedRef.current = true;
            return;
        }

        if (inputValue === '') {
            setSearchTerm('');
        }
    }, [inputValue]);

    // 修正点：点击筛选按钮时，清空搜索输入框
    const handleFilterClick = useCallback((categoryLabel) => {
        if (!categoryLabel) return;
        
        if (categoryLabel === (t('categories.all') || 'All') || categoryLabel.toLowerCase() === 'all') {
            setActiveCategory('all');
            setSearchTerm('');
            setInputValue('');
            return;
        }

        const found = findCategoryByLabel(categoryLabel);
        if (found) {
            setActiveCategory(canonicalKey(found));
        } else {
            setActiveCategory(categoryLabel.trim().split(/\s+/).join(' ').toLowerCase());
        }
        // 更改 activeCategory，触发 useInfiniteQuery 重新获取
        setSearchTerm('');
        setInputValue('');
    }, [findCategoryByLabel, canonicalKey, t]);

    // 处理 Pricing Model 变更，并清空搜索
    const handlePricingChange = (e) => {
        const value = e.target.value;
        setPricingModel(value);
        // 更改 pricingModel，触发 useInfiniteQuery 重新获取
        if (searchTerm || inputValue) {
            setSearchTerm('');
            setInputValue('');
        }
    };

    // 处理 Rating 变更，并清空搜索
    const handleRatingChange = (e) => {
        const value = e.target.value;
        setRating(value);
        // 更改 rating，触发 useInfiniteQuery 重新获取
        if (searchTerm || inputValue) {
            setSearchTerm('');
            setInputValue('');
        }
    };


    // -----------------------------------------------------------
    // 5. IntersectionObserver (使用 React Query 状态)
    // -----------------------------------------------------------

    useEffect(() => {
        const sentinel = sentinelRef.current;
        
        // 只有当有下一页，且当前没有在加载（包括首次和加载更多）时，才准备观察
        // isFetching 包含 isLoading 和 isFetchingNextPage，所以这里使用 !isFetching 即可
        const canLoadMore = hasNextPage && !isFetching; 

        if (!sentinel || !canLoadMore) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // 如果可见且可以加载更多
                if (entry.isIntersecting && canLoadMore) { 
                    fetchNextPage(); // 调用 React Query 的加载更多函数
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
    }, [fetchNextPage, hasNextPage, isFetching]); // 依赖项调整为 useInfiniteQuery 提供的状态和函数


    // -----------------------------------------------------------
    // 6. Render
    // -----------------------------------------------------------

    const displayError = isError ? toolsError?.message || t('home.loadError') : null;

    return (
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">

            {/* 1. Search Bar */}
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

            {/* 2. Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-10">
                {/* All Tools Button */}
                <FilterButton
                    category={t('categories.all')}
                    isActive={activeCategory === 'all'}
                    onClick={() => handleFilterClick(t('categories.all') || 'all')}
                />

                {/* Dynamic Category Buttons */}
                {/* 使用 isCategoriesLoading 替换 catsLoading */}
                {isCategoriesLoading ? (
                    <div className="flex items-center px-2">
                        <div className="animate-pulse h-9 w-24 bg-gray-100 rounded-full" />
                    </div>
                ) : (
                    displayCategories.map(cat => {
                            const label = (locale === 'zh' ? cat.zh : cat.en) || cat.en || cat.zh || '';
                            const key = canonicalKey(cat);
                            return (
                                <FilterButton
                                    key={key || label}
                                    category={label}
                                    isActive={activeCategory === key}
                                    onClick={() => handleFilterClick(label)}
                                />
                            );
                        })
                )}

                {/* Pricing Model Dropdown + Rating Filter */}
                <div className="flex items-center ml-2 gap-2">
                    <label className="sr-only">Pricing</label>
                    <select
                        value={pricingModel}
                        onChange={handlePricingChange}
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
                        onChange={handleRatingChange}
                        className="h-9 px-3 rounded-full border border-[#E2E8F0] dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
                    >
                        <option value="">{t('home.ratingAll') || 'All ratings'}</option>
                        <option value="4">{t('home.rating4Plus') || '4+'}</option>
                        <option value="3">{t('home.rating3Plus') || '3+'}</option>
                        <option value="2">{t('home.rating2Plus') || '2+'}</option>
                    </select>
                </div>
            </div>

            {/* 3. Tool Grid */}
            {isLoading ? ( // 首次加载状态
                <div className="text-center py-20">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                    <p className="text-xl text-gray-600 dark:text-gray-400">{t('home.loadingTools')}</p>
                </div>
            ) : displayError ? ( // 错误状态
                <div className="text-center py-10 text-red-600 dark:text-red-400">
                    <p className="text-xl font-semibold mb-2">{t('home.error')}</p>
                    <p>{displayError}</p>
                </div>
            ) : uniqueDisplayTools.length > 0 ? (
                // 工具卡片网格
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

            {/* Sentinel: 用于触发自动加载更多，仅在有下一页时显示 */}
            {hasNextPage && (
                <div ref={sentinelRef} className="mt-8 h-6"></div>
            )}

            {/* 加载更多指示器 */}
            {isFetchingNextPage && ( // 使用 React Query 的 isFetchingNextPage
                <div className="text-center py-6">
                    <div className="animate-spin inline-block w-6 h-6 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('home.loadingMore') || 'Loading more...'}</p>
                </div>
            )}
        </div>
    );
};

export default Home;