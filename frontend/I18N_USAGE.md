# 国际化 (i18n) 使用指南

本项目已完成国际化配置，支持中文和英文两种语言。

## 📁 文件结构

```
frontend/src/
├── i18n/
│   ├── I18nContext.jsx          # i18n Context Provider
│   └── locales/
│       ├── en.js                # 英文翻译
│       └── zh.js                # 中文翻译
├── components/
│   └── common/
│       └── LanguageSwitcher.jsx # 语言切换组件
└── main.jsx                     # I18nProvider 已集成
```

## 🚀 快速开始

### 1. 在组件中使用翻译

```jsx
import { useI18n } from '../i18n/I18nContext';

function MyComponent() {
  const { t } = useI18n();
  
  return (
    <div>
      <h1>{t('common.appName')}</h1>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

### 2. 使用带参数的翻译

```jsx
const { t } = useI18n();

// 翻译文件中: "welcome: 'Welcome, {username}'"
const message = t('adminReview.welcome', { username: 'John' });
// 结果: "Welcome, John"
```

### 3. 切换语言

```jsx
import { useI18n } from '../i18n/I18nContext';

function LanguageSelector() {
  const { locale, changeLocale } = useI18n();
  
  return (
    <button onClick={() => changeLocale(locale === 'en' ? 'zh' : 'en')}>
      {locale === 'en' ? '中文' : 'English'}
    </button>
  );
}
```

### 4. 使用内置的语言切换组件

```jsx
import LanguageSwitcher from './components/common/LanguageSwitcher';

function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  );
}
```

## 📝 添加新的翻译

### 1. 在翻译文件中添加新的键值

**en.js:**
```javascript
export default {
  myFeature: {
    title: 'My Feature',
    description: 'This is my feature',
    action: 'Click here',
  },
};
```

**zh.js:**
```javascript
export default {
  myFeature: {
    title: '我的功能',
    description: '这是我的功能',
    action: '点击这里',
  },
};
```

### 2. 在组件中使用

```jsx
function MyFeature() {
  const { t } = useI18n();
  
  return (
    <div>
      <h2>{t('myFeature.title')}</h2>
      <p>{t('myFeature.description')}</p>
      <button>{t('myFeature.action')}</button>
    </div>
  );
}
```

## 🔑 现有翻译键

### 通用 (common)
- `common.appName` - 应用名称
- `common.submit` - 提交
- `common.cancel` - 取消
- `common.loading` - 加载中...
- `common.error` - 错误
- `common.success` - 成功
- 等等...

### 页头 (header)
- `header.login` - 登录
- `header.logout` - 登出
- `header.submitTool` - 提交工具
- `header.mySubmissions` - 我的提交

### 首页 (home)
- `home.title` - 页面标题
- `home.searchPlaceholder` - 搜索占位符
- `home.noToolsFound` - 无工具提示
- 等等...

### 更多键请查看 `src/i18n/locales/en.js` 和 `zh.js`

## 🎨 示例：更新现有页面

### 更新 Home 页面

```jsx
import { useI18n } from '../i18n/I18nContext';

function Home() {
  const { t } = useI18n();
  
  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>
      <input placeholder={t('home.searchPlaceholder')} />
      {tools.length === 0 && <p>{t('home.noToolsFound')}</p>}
    </div>
  );
}
```

### 更新 Login 页面

```jsx
import { useI18n } from '../i18n/I18nContext';

function Login() {
  const { t } = useI18n();
  
  return (
    <div>
      <h1>{t('login.welcomeBack')}</h1>
      <p>{t('login.chooseMethod')}</p>
      <button>{t('login.continueWith')} Google</button>
      <p>{t('login.agreeTo')} <a>{t('login.termsOfService')}</a></p>
    </div>
  );
}
```

## 💡 最佳实践

1. **使用语义化的键名**: 使用 `feature.action` 而不是 `button1`
2. **组织结构**: 按页面或功能模块组织翻译
3. **保持一致性**: 相同的文本在不同地方使用相同的键
4. **避免硬编码**: 所有用户可见的文本都应该通过 `t()` 函数
5. **参数化**: 对于动态内容，使用参数而不是字符串拼接

## 🔍 完整的 API

### `useI18n()` Hook

返回一个包含以下属性的对象：

- `locale`: 当前语言 ('en' 或 'zh')
- `t(key, params)`: 翻译函数
- `changeLocale(locale)`: 切换语言函数
- `availableLocales`: 可用语言数组 `['en', 'zh']`

### `t(key, params)` 函数

- `key`: 翻译键，支持点号分隔的路径
- `params`: 可选，用于替换翻译文本中的参数

示例：
```javascript
t('common.submit')                           // "Submit"
t('adminReview.welcome', { username: 'Tom' }) // "Welcome, Tom"
```

## 📦 待完成的页面国际化

以下页面需要集成国际化（已提供翻译文本）：

- ✅ App.jsx (Header/Footer) - 已完成
- ⏳ Home.jsx
- ⏳ ToolDetail.jsx
- ⏳ Login.jsx
- ⏳ AdminLogin.jsx
- ⏳ AdminReview.jsx
- ⏳ AdminToolDetail.jsx
- ⏳ ToolForm.jsx
- ⏳ MySubmissions.jsx

## 🌐 语言存储

- 用户选择的语言会自动保存到 `localStorage`
- 键名: `ai-tool-hub-locale`
- 页面刷新后会自动恢复用户的语言选择
- 如果没有保存的语言，会根据浏览器语言自动选择（中文用户默认中文，其他默认英文）

## 🛠️ 扩展支持更多语言

如果需要添加更多语言（如日语、韩语等）：

1. 在 `src/i18n/locales/` 中创建新的语言文件（如 `ja.js`）
2. 在 `I18nContext.jsx` 中导入并添加到 `translations` 对象
3. 更新 `LanguageSwitcher` 组件以支持更多语言选项

示例：
```javascript
// I18nContext.jsx
import ja from './locales/ja';

const translations = {
  en,
  zh,
  ja,  // 新增日语
};
```
