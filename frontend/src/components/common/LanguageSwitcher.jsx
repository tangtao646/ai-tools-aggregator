import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/I18nContext';

const LanguageSwitcher = ({ className = '' }) => {
  const { locale, changeLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
    //{ code: 'es', name: 'Español' }
  ];

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (langCode) => {
    changeLocale(langCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
        title="Change Language"
      >
        <span className="material-symbols-outlined text-lg">
          language
        </span>
        <span className="text-sm font-medium">{currentLanguage.name}</span>
        <span className="material-symbols-outlined text-sm">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                locale === lang.code 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="text-sm font-medium flex-1">{lang.name}</span>
              {locale === lang.code && (
                <span className="material-symbols-outlined text-sm">
                  check
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
