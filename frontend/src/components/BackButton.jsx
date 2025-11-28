import React from 'react';
import { useI18n } from '../i18n/I18nContext';

export default function BackButton({ onClick, variant = 'floating', labelKey = 'common.back', defaultLabel = 'Back', title }) {
  const { t } = useI18n();
  const label = (t && typeof t === 'function') ? t(labelKey) : defaultLabel;

  if (variant === 'inline') {
    return (
      <button onClick={onClick} className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>{label || defaultLabel}</span>
      </button>
    );
  }

  // floating (ToolDetail style)
  return (
    <button
      onClick={onClick}
      className="fixed top-6 left-6 z-50 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
      title={title || label || defaultLabel}
      aria-label={title || label || defaultLabel}
    >
      <span className="material-symbols-outlined text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">arrow_back</span>
    </button>
  );
}
