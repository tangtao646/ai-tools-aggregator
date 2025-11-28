import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { authApi } from '../api/apiClient';
import PageBackground from '../components/common/PageBackground';
import BackButton from '../components/BackButton';
import { useI18n } from '../i18n/I18nContext';

// Constants definition
const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  GITHUB_OAUTH_AGREED: 'github-oauth-agreed'
};

const ERROR_MESSAGES = {
  TERMS_NOT_AGREED: 'Please agree to the Terms of Service and Privacy Policy first',
  GOOGLE_LOGIN_FAILED: 'Google login failed, please try again',
  GITHUB_LOGIN_FAILED: 'GitHub login failed, please try again'
};

const Login = ({ onLoginSuccess, onBack }) => {
  const { t } = useI18n();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Utility function: Get URL parameters
  const getUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      code: urlParams.get('code'),
      agreed: sessionStorage.getItem(STORAGE_KEYS.GITHUB_OAUTH_AGREED)
    };
  };

  // Utility function: Clear URL parameters
  const clearUrlParams = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  // Common OAuth success handler
  const handleOAuthSuccess = (token, user) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    onLoginSuccess();
  };

  // GitHub callback handler
  const handleGitHubCallback = async (code) => {
    setGithubLoading(true);
    setError(null);
    
    // Clear agreement status
    sessionStorage.removeItem(STORAGE_KEYS.GITHUB_OAUTH_AGREED);
    
    try {
      const response = await authApi.githubLogin(code);
      handleOAuthSuccess(response.data.token, response.data.user);
    } catch (err) {
      console.error('GitHub login failed:', err);
      setError(err.response?.data?.detail || t('login.githubLoginFailed'));
      setGithubLoading(false);
    } finally {
      clearUrlParams();
    }
  };

  // Check if it's a GitHub callback on initialization
  useEffect(() => {
    const { code, agreed } = getUrlParams();
    
    // If there's a code and user previously agreed to terms, automatically set agreement status
    if (code && agreed === 'true') {
      setAgreedToTerms(true);
    }
  }, []);
  
  // Handle GitHub callback
  useEffect(() => {
    const { code, agreed } = getUrlParams();
    
    if (code && agreed === 'true') {
      handleGitHubCallback(code);
    }
  }, [onLoginSuccess]);

  // Google login handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!agreedToTerms) {
        setError(t('login.termsNotAgreed'));
        return;
      }
      
      setGoogleLoading(true);
      setError(null);
      
      try {
        const response = await authApi.googleLogin(tokenResponse.access_token);
        handleOAuthSuccess(response.data.token, response.data.user);
      } catch (err) {
        console.error('Google login failed:', err);
        setError(err.response?.data?.detail || t('login.googleLoginFailed'));
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google OAuth Error:', error);
      setError(t('login.googleLoginFailed'));
      setGoogleLoading(false);
    },
    flow: 'implicit',
  });

  const handleGoogleLoginClick = () => {
    if (!agreedToTerms) {
      setError(t('login.termsNotAgreed'));
      return;
    }
    handleGoogleLogin();
  };

  // GitHub OAuth login handler
  const handleGitHubLogin = () => {
    if (!agreedToTerms) {
      setError(t('login.termsNotAgreed'));
      return;
    }
    
    // Save agreement status to sessionStorage
    sessionStorage.setItem(STORAGE_KEYS.GITHUB_OAUTH_AGREED, 'true');
    
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/login`;
    const scope = 'read:user user:email';
    
    // Redirect to GitHub authorization page
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  // Social login button component
  const SocialLoginButton = ({ provider, icon, onClick, loading, disabled }) => {
    const spinnerColor = provider === 'GitHub' 
      ? 'border-gray-300 border-t-gray-900 dark:border-t-white' 
      : 'border-gray-300 border-t-primary';

    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-3 text-base font-medium text-gray-700 dark:text-gray-200 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className={`w-6 h-6 border-2 ${spinnerColor} rounded-full animate-spin`}></div>
            <span>{t('login.loggingIn')}</span>
          </>
        ) : (
          <>
            {icon}
            <span>{t('login.continueWith', { provider })}</span>
          </>
        )}
      </button>
    );
  };

  return (
    <PageBackground>
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
        {/* Back Button */}
        {onBack && (
          <BackButton onClick={onBack} variant="floating" title={t('common.backToHome') || 'Back'} />
        )}
        
        {/* Card container */}
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
        {/* Logo and Title */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-2 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="material-symbols-outlined text-white text-2xl">auto_awesome</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">AI Tool Hub</p>
          </div>
          <h1 className="text-[#0f0e1b] dark:text-gray-100 tracking-light text-[32px] font-bold leading-tight px-4 pb-3 pt-6">
            {t('login.welcomeBack')}
          </h1>
          <p className="text-[#0f0e1b] dark:text-gray-400 text-base font-normal leading-normal px-4 text-center">
            {t('login.chooseMethod')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4">
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Social Login Buttons */}
        <div className="flex flex-col gap-4 px-4 py-3">
          <SocialLoginButton
            provider={t('login.google')}
            onClick={handleGoogleLoginClick}
            loading={googleLoading}
            disabled={googleLoading || githubLoading}
            icon={
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            }
          />
          
          <SocialLoginButton
            provider={t('login.github')}
            onClick={handleGitHubLogin}
            loading={githubLoading}
            disabled={googleLoading || githubLoading}
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            }
          />
        </div>

        {/* Terms and Privacy Notice with Checkbox */}
        <div className="px-4 py-3 ">
          <div className="flex items-center justify-center gap-3 ">
            <input
              type="checkbox"
              id="terms-checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded-full border-gray-300 dark:border-gray-600 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="terms-checkbox" className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed cursor-pointer">
              {t('login.agreeTo')}{' '}
              <a href="/terms" className="text-primary underline hover:no-underline font-medium" onClick={(e) => e.stopPropagation()}>
                {t('login.termsOfService')}
              </a>
              {' '}{t('login.and')}{' '}
              <a href="/privacy" className="text-primary underline hover:no-underline font-medium" onClick={(e) => e.stopPropagation()}>
                {t('login.privacyPolicy')}
              </a>
            </label>
          </div>
        </div>
      </div>
      </div>
    </PageBackground>
  );
};

export default Login;
