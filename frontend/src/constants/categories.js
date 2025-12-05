/**
 * 工具分类配置
 * 可在多个页面中复用
 * 
 * 注意：这里存储的是分类的 key，用于 i18n 翻译
 * 实际显示的文本会根据当前语言从语言包中获取
 */
export const CATEGORIES =
    [{ "zh": "对话", "en": "chat" },
    { "zh": "编程", "en": "coding" },
    { "zh": "图像", "en": "image" },
    { "zh": "视频", "en": "video" },
    { "zh": "音频", "en": "audio" },
    { "zh": "文本", "en": "text" },
    { "zh": "其他", "en": "other" },];

/**
 * 获取所有分类（包含"全部工具"选项）
 */
export const getAllCategories = () => ['all', ...CATEGORIES];

/**
 * 检查分类是否有效
 */
export const isValidCategory = (category) => {
    return category === 'all' || CATEGORIES.includes(category);
};

/**
 * 获取分类的翻译键
 */
export const getCategoryI18nKey = (category) => {
    return `categories.${category}`;
};
