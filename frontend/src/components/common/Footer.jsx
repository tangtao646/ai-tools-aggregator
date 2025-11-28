import React from 'react';
import { useI18n } from '../../i18n/I18nContext.jsx';

const Footer = () => {
    const { t } = useI18n();

    return (
        <footer className="w-full border-t border-[#E2E8F0] dark:border-gray-700 py-4">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center space-y-2">
                    {/* Footer Links */}
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                        <a
                            href="/terms"
                            className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors underline hover:brightness-110"
                        >
                            Terms of Service
                        </a>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <a
                            href="/privacy"
                            className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors underline hover:brightness-110"
                        >
                            Privacy Policy
                        </a>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        {/* <a
                            href="mailto:taoge646@gmail.com"
                            className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                        >
                            Contact Us
                        </a> */}
                    </div>

                    {/* Copyright */}
                    {/* <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                        {t('footer.copyright')}
                    </div> */}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
