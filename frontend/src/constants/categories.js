/**
 * 工具分类配置
 * 可在多个页面中复用
 * 
 * 注意：这里存储的是分类的 key，用于 i18n 翻译
 * 实际显示的文本会根据当前语言从语言包中获取
 */
export const CATEGORIES = [
    'chat',    // i18n: categories.chat
    'coding',  // i18n: categories.coding
    'image',   // i18n: categories.image
    'video',   // i18n: categories.video
    'audio',   // i18n: categories.audio
    'text',    // i18n: categories.text
    'other'    // i18n: categories.other
];


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
