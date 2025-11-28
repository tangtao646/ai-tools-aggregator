import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toolApi } from '../api/apiClient';
import PageBackground from '../components/common/PageBackground';
import BackButton from '../components/BackButton';
import { useI18n } from '../i18n/I18nContext';

function MySubmissions({ onBack }) {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Get user info from localStorage
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    const isLoggedIn = !!localStorage.getItem('token');

    // Auto-query when component loads
    useEffect(() => {

        const fetchSubmissions = async () => {
            if (!isLoggedIn) {
                setError(t('mySubmissions.loginRequired'));
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');
                const response = await toolApi.getMySubmissions();
                setTools(response.data || []);
            } catch (err) {
                console.error('Error details:', err.response?.data);

                if (err.response?.status === 401) {
                    setError(t('mySubmissions.loginExpired'));
                } else if (err.response?.status === 422) {
                    setError(t('mySubmissions.tokenFormatError', { detail: JSON.stringify(err.response.data) }));
                } else {
                    setError(t('mySubmissions.queryFailed', { detail: err.response?.data?.detail || err.message }));
                }
                setTools([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, [isLoggedIn]);

    const getStatusInfo = (status) => {
        const statusMap = {
            "PENDING": {
                text: t('mySubmissions.status.pending'),
                color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                icon: t('mySubmissions.statusIcons.pending')
            },
            "APPROVED_PENDING_SEO": {
                text: t('mySubmissions.status.approvedPendingSeo'),
                color: 'bg-blue-100 text-blue-800 border-blue-300',
                icon: t('mySubmissions.statusIcons.approvedPendingSeo')
            },
            "SEO_GENERATED": {
                text: t('mySubmissions.status.seoGenerated'),
                color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                icon: t('mySubmissions.statusIcons.seoGenerated')
            },
            "PUBLISHED": {
                text: t('mySubmissions.status.published'),
                color: 'bg-green-100 text-green-800 border-green-300',
                icon: t('mySubmissions.statusIcons.published')
            },
            "REJECTED": {
                text: t('mySubmissions.status.rejected'),
                color: 'bg-red-100 text-red-800 border-red-300',
                icon: t('mySubmissions.statusIcons.rejected')
            }
        };

    

        return statusMap[status];
    };

    return (
        <PageBackground>
            <BackButton onClick={() => {
                if (onBack && typeof onBack === 'function') return onBack();
                if (window.history.length > 1) return navigate(-1);
            }} />

            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* Page title */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">{t('mySubmissions.title')}</h1>

                </div>

                {/* Loading state */}
                {loading && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('mySubmissions.loading')}</p>
                    </div>
                )}

                {/* Error message */}
                {error && !loading && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg text-center">
                        {error}
                        {!isLoggedIn && (
                            <div className="mt-4">
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                                >
                                    {t('mySubmissions.backToHomeLogin')}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Results list */}
                {!loading && !error && (
                    <div className="space-y-4">
                        {tools.length === 0 ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                                <p className="text-gray-500 dark:text-gray-400">{t('mySubmissions.noSubmissions')}</p>
                                <button
                                    onClick={() => navigate('/submit')}
                                    className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                                >
                                    {t('mySubmissions.submitNow')}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    {t('mySubmissions.totalSubmissions', { count: tools.length })}
                                </div>

                                {tools.map((tool) => {
                                    const statusInfo = getStatusInfo(tool.review_status);
                                    const canEdit = tool.review_status === "REJECTED" && tool.edit_count < 3;

                        
                                
                                    return (
                                        <div key={tool.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition p-6">
                                            <div className="flex items-start justify-between">
                                                {/* Tool info */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        {tool.logo_url && (
                                                            <img
                                                                src={tool.logo_url.startsWith('http') ? tool.logo_url : `http://localhost:8000${tool.logo_url}`}
                                                                alt={tool.name}
                                                                className="w-12 h-12 rounded-lg object-cover"
                                                            />
                                                        )}
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{tool.name}</h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">{tool.category}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700 dark:text-gray-300 mb-2">{tool.short_description}</p>

                                                    {/* Edit count */}
                                                    {tool.edit_count > 0 && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {t('mySubmissions.editedCount', { count: tool.edit_count })} {tool.edit_count >= 3 && t('mySubmissions.editLimitReached')}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Status and actions */}
                                                <div className="ml-6 flex flex-col items-end gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${statusInfo.color}`}>
                                                        {statusInfo.icon} {statusInfo.text}
                                                    </span>

                                                    {/* Rejection reason */}
                                                    {tool.review_status === "REJECTED" && tool.rejection_reason && (
                                                        <div className="text-right max-w-xs">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('mySubmissions.rejectionReason')}</p>
                                                            <p className="text-sm text-red-600 dark:text-red-400">{tool.rejection_reason}</p>
                                                        </div>
                                                    )}

                                                    {/* Edit button */}
                                                    {canEdit ? (
                                                        <button
                                                            onClick={() => navigate(`/edit-tool/${tool.id}`)}
                                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition text-sm"
                                                        >
                                                            {t('mySubmissions.editAgain')}
                                                        </button>
                                                    ) : tool.review_status === "REJECTED" && tool.edit_count >= 3 ? (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('mySubmissions.editLimitReachedText')}</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                )}

                {/* Tips */}
                {!loading && !error && tools.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-8">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">{t('mySubmissions.tipsTitle')}</h3>
                        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                            <li>{t('mySubmissions.tip1')}</li>
                            <li>{t('mySubmissions.tip2')}</li>
                            <li>{t('mySubmissions.tip3')}</li>
                            <li>{t('mySubmissions.tip4')}</li>
                        </ul>
                    </div>
                )}
            </div>
        </PageBackground>
    );
}

export default MySubmissions;
