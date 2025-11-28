import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../api/adminApi';
import { useI18n } from '../i18n/I18nContext';

function AdminLogin() {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error message
    // If user typed an email-like value, we'll check with the server (to avoid hardcoding admin email)
    if (name === 'username' && value.includes('@')) {
      // fire-and-forget check; do not block typing
      (async () => {
        try {
          const res = await adminApi.isAdmin(value);
          if (!res?.is_admin) {
            window.location.href = '/';
          }
        } catch (err) {
          // On network error, be conservative and redirect to home
          console.warn('isAdmin check failed', err);
          window.location.href = '/';
        }
      })();
    }
  };

  const handleUsernameBlur = async (e) => {
    const v = e.target.value || '';
    if (v.includes('@')) {
      try {
        const res = await adminApi.isAdmin(v);
        if (!res?.is_admin) window.location.href = '/';
      } catch (err) {
        console.warn('isAdmin check failed', err);
        window.location.href = '/';
      }
    }
  };

  const handleUsernamePaste = async (e) => {
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    if (paste.includes('@')) {
      e.preventDefault();
      try {
        const res = await adminApi.isAdmin(paste);
        if (!res?.is_admin) {
          window.location.href = '/';
          return;
        }
        // allow paste by inserting into input
        setFormData(prev => ({ ...prev, username: paste }));
      } catch (err) {
        console.warn('isAdmin check failed', err);
        window.location.href = '/';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminApi.login(formData.username, formData.password);
      
      // Save Token to localStorage
      localStorage.setItem('admin_token', response.access_token);
      localStorage.setItem('admin_username', response.username);
      
      // Redirect to review page
      window.location.href = '/admin/review';
    } catch (err) {
      setError(err.response?.data?.detail || t('adminLogin.errors.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const handleBackHome = () => {
    // Prefer going back in history instead of forcing home
    try {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(-1);
      }
    } catch (err) {
      console.warn('Back navigation failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('adminLogin.title')}</h1>
          <p className="text-gray-600">{t('adminLogin.subtitle')}</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('adminLogin.username')}
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onBlur={handleUsernameBlur}
                onPaste={handleUsernamePaste}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder={t('adminLogin.enterUsername')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('adminLogin.password')}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder={t('adminLogin.enterPassword')}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('adminLogin.loggingIn') : t('adminLogin.loginButton')}
            </button>
          </form>

          {/* Back to home link */}
          <div className="mt-6 text-center">
            <button
              onClick={handleBackHome}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              ← {t('common.backToHome')}
            </button>
          </div>
        </div>

       
      </div>
    </div>
  );
}

export default AdminLogin;
