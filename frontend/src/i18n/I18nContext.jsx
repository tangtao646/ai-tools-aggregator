import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import en from './locales/en';
import zh from './locales/zh';
import es from './locales/es';

const translations = {
  en,
  zh,
  es,
};

const I18nContext = createContext();

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};

export const I18nProvider = ({ children }) => {
  // Initialize language from localStorage or browser preference
  const [locale, setLocale] = useState(() => {
    const savedLocale = localStorage.getItem('ai-tool-hub-locale');
    if (savedLocale && translations[savedLocale]) {
      return savedLocale;
    }
    
    // Check browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }
    if (browserLang.startsWith('es')) {
      return 'es';
    }
    return 'en';
  });

  // Save locale to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('ai-tool-hub-locale', locale);
  }, [locale]);

  // Get translated text by key path (e.g., 'common.submit')
  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    // Replace parameters in the string
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match;
      });
    }
    
    return value || key;
  }, [locale]); // 只依赖 locale，避免每次渲染都重新创建

  // Change language
  const changeLocale = (newLocale) => {
    if (translations[newLocale]) {
      setLocale(newLocale);
    } else {
      console.warn(`Locale not supported: ${newLocale}`);
    }
  };

  const value = {
    locale,
    t,
    changeLocale,
    availableLocales: Object.keys(translations),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
