import { useState, useEffect } from 'react';
import { toolApi } from '../api/apiClient';
import adminApi from '../api/adminApi';
import { useI18n } from '../i18n/I18nContext';
import BackButton from '../components/BackButton';

function AdminToolDetail({ toolId, onBack }) {
  const { t } = useI18n();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [generatingSEO, setGeneratingSEO] = useState(false);

  useEffect(() => {
    loadToolDetail();
  }, [toolId]);

  const loadToolDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await toolApi.getToolDetail(toolId);
      setTool(response.data);
      // If there's an existing rejection reason, load it
      if (response.data.rejection_reason) {
        setRejectionReason(response.data.rejection_reason);
      }
    } catch (err) {
      console.error('Failed to load tool details:', err);
      setError(err.response?.status === 404 
        ? t('adminToolDetail.toolNotFound')
        : t('adminToolDetail.failedToLoad')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status) => {
    // If it's a rejection action, show modal
    if (status === 'REJECTED') {
      setShowRejectModal(true);
      return;
    }

    // Approve or reset to pending
    const statusText = { 
      'PUBLISHED': t('common.approve'), 
      'PENDING': t('adminToolDetail.markAsPending') 
    };
    if (!confirm(status === 'PUBLISHED' ? t('adminToolDetail.confirmApprove') : t('adminToolDetail.confirmMarkPending'))) {
      return;
    }

    try {
      await adminApi.updateReviewStatus(toolId, status);
      alert(t('adminToolDetail.reviewSuccess', { action: statusText[status] }));
      loadToolDetail();
    } catch (error) {
      console.error('Review failed:', error);
      alert(t('adminToolDetail.operationFailed'));
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert(t('adminToolDetail.rejectionReasonRequired'));
      return;
    }

    try {
      await adminApi.updateReviewStatus(toolId, 'REJECTED', rejectionReason);
      alert(t('adminToolDetail.reviewSuccess', { action: t('common.reject') }));
      setShowRejectModal(false);
      loadToolDetail();
    } catch (error) {
      console.error('Review failed:', error);
      alert(error.response?.data?.detail || t('adminToolDetail.operationFailed'));
    }
  };

  const handleGenerateSEO = async () => {
    if (!confirm(t('adminToolDetail.confirmGenerateSEO'))) {
      return;
    }

    setGeneratingSEO(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:8000/api/v1/admin/tools/${toolId}/generate-seo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'SEO generation failed');
      }

      const data = await response.json();
      alert(t('adminToolDetail.seoGeneratedSuccess'));
      loadToolDetail(); // 重新加载查看 SEO 内容
    } catch (error) {
      console.error('SEO generation failed:', error);
      alert(t('adminToolDetail.seoGenerationFailed', { error: error.message }));
    } finally {
      setGeneratingSEO(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { text: t('adminToolDetail.statusPending'), color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      'APPROVED_PENDING_SEO': { text: t('adminToolDetail.statusApprovedPendingSEO'), color: 'bg-blue-100 text-blue-800 border-blue-300' },
      'SEO_GENERATED': { text: t('adminToolDetail.statusSEOGenerated'), color: 'bg-purple-100 text-purple-800 border-purple-300' },
      'REJECTED': { text: t('adminToolDetail.statusRejected'), color: 'bg-red-100 text-red-800 border-red-300' },
      'PUBLISHED': { text: t('adminToolDetail.statusApproved'), color: 'bg-green-100 text-green-800 border-green-300' }
    };
    const config = statusConfig[status] || statusConfig['PENDING'];
    return (
      <div className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border-2 ${config.color}`}>
        {config.text}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">{t('adminToolDetail.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-12 text-center max-w-md">
          <p className="text-red-600 text-xl font-semibold mb-4">{error}</p>
          <button
            onClick={onBack}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
          >
            {t('adminToolDetail.backToList')}
          </button>
        </div>
      </div>
    );
  }

  if (!tool) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <BackButton onClick={onBack} variant="inline" labelKey={'adminToolDetail.backToReviewList'} defaultLabel={t('adminToolDetail.backToReviewList') || 'Back'} />
            {getStatusBadge(tool.review_status)}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Tool header */}
          <div className="mb-8">
            <div className="flex items-start gap-6 mb-6">
              {/* Logo */}
              {tool.logo_url && (
                <div className="flex-shrink-0">
                  <img
                    src={tool.logo_url.startsWith('http') ? tool.logo_url : `http://localhost:8000${tool.logo_url}`}
                    alt={tool.name}
                    className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                  />
                </div>
              )}
              
              {/* Title and basic info */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">{tool.name}</h1>
                <div className="flex items-center gap-4 mb-4">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                    {tool.category}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    {tool.pricing_model}
                  </span>
                  {/* Edit count display */}
                  {tool.edit_count > 0 && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                      {t('adminToolDetail.editedCount', { count: tool.edit_count })} {tool.edit_count >= 3 ? t('adminToolDetail.limitReached') : ''}
                    </span>
                  )}
                </div>
                <p className="text-lg text-gray-700 font-medium">{tool.short_description}</p>
              </div>
            </div>

            {/* Tags */}
            {tool.tags && tool.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tool.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Website link */}
            {tool.website_url && (
              <a
                href={tool.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {t('adminToolDetail.visitWebsite')}
              </a>
            )}
          </div>

          {/* Detailed information cards */}
          <div className="space-y-6">
            {/* Description */}
            <div className="border-l-4 border-indigo-500 pl-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">{t('adminToolDetail.detailedDescription')}</h2>
              <p className="text-gray-700 leading-relaxed">{tool.description}</p>
            </div>

            {/* Features */}
            {tool.features && tool.features.length > 0 && (
              <div className="border-l-4 border-green-500 pl-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('adminToolDetail.keyFeatures')}</h2>
                <ul className="space-y-2">
                  {tool.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Use Cases */}
            {tool.use_cases && tool.use_cases.length > 0 && (
              <div className="border-l-4 border-purple-500 pl-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('adminToolDetail.useCases')}</h2>
                <ul className="space-y-2">
                  {tool.use_cases.map((useCase, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pricing Details */}
            {tool.pricing_details && (
              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3">{t('adminToolDetail.pricingDetails')}</h2>
                <p className="text-gray-700 leading-relaxed">{tool.pricing_details}</p>
              </div>
            )}

            {/* SEO Generated Content (only shown when SEO_GENERATED or PUBLISHED) */}
            {(tool.review_status === 'SEO_GENERATED' || tool.review_status === 'PUBLISHED') && (
              <>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-purple-900 mb-4">🤖 {t('adminToolDetail.generatedSEOContent')}</h2>
                  
                  {/* Meta Title */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-purple-700 mb-1">{t('adminToolDetail.metaTitle')}</h3>
                    <p className="text-gray-800 bg-white p-2 rounded border border-purple-200">{tool.meta_title || 'N/A'}</p>
                  </div>

                  {/* Meta Description */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-purple-700 mb-1">{t('adminToolDetail.metaDescription')}</h3>
                    <p className="text-gray-800 bg-white p-2 rounded border border-purple-200">{tool.meta_description || 'N/A'}</p>
                  </div>

                  {/* Pros */}
                  {tool.pros && tool.pros.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-purple-700 mb-2">{t('adminToolDetail.pros')}</h3>
                      <ul className="space-y-1 bg-white p-3 rounded border border-purple-200">
                        {tool.pros.map((pro, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-800">
                            <span className="text-green-500 font-bold">+</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cons */}
                  {tool.cons && tool.cons.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-purple-700 mb-2">{t('adminToolDetail.cons')}</h3>
                      <ul className="space-y-1 bg-white p-3 rounded border border-purple-200">
                        {tool.cons.map((con, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-800">
                            <span className="text-red-500 font-bold">-</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* FAQs */}
                  {tool.faqs && tool.faqs.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-purple-700 mb-2">{t('adminToolDetail.faqs')}</h3>
                      <div className="space-y-3 bg-white p-3 rounded border border-purple-200">
                        {tool.faqs.map((faq, index) => (
                          <div key={index}>
                            <p className="font-semibold text-gray-900">Q: {faq.question}</p>
                            <p className="text-gray-700 mt-1">A: {faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Rejection reason (only shown when rejected) */}
            {tool.review_status === 'REJECTED' && tool.rejection_reason && (
              <div className="border-l-4 border-red-500 pl-6 bg-red-50 p-4 rounded-r-lg">
                <h2 className="text-xl font-bold text-red-900 mb-3">{t('adminToolDetail.rejectionReason')}</h2>
                <p className="text-red-700 leading-relaxed">{tool.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed bottom review action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p className="font-medium">{t('adminToolDetail.reviewThisTool')}</p>
              <p className="text-xs">{t('adminToolDetail.checkAllInfo')}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {tool.review_status === 'PENDING' ? (
                // 第一阶段：内容审核
                <>
                  <button
                    onClick={() => handleReview('REJECTED')}
                    className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
                  >
                    {t('adminToolDetail.reject')}
                  </button>
                  <button
                    onClick={() => handleReview('APPROVED_PENDING_SEO')}
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition"
                  >
                    {t('adminToolDetail.approveAndGenerateSEO')}
                  </button>
                </>
              ) : tool.review_status === 'APPROVED_PENDING_SEO' ? (
                // 等待生成 SEO
                <button
                  onClick={handleGenerateSEO}
                  disabled={generatingSEO}
                  className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-semibold rounded-lg transition"
                >
                  {generatingSEO ? t('adminToolDetail.generating') : t('adminToolDetail.generateSEO')}
                </button>
              ) : tool.review_status === 'SEO_GENERATED' ? (
                // 第二阶段：SEO 审核
                <>
                  <button
                    onClick={() => handleReview('REJECTED')}
                    className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
                  >
                    {t('adminToolDetail.rejectSEO')}
                  </button>
                  <button
                    onClick={handleGenerateSEO}
                    disabled={generatingSEO}
                    className="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-medium rounded-lg transition text-sm"
                  >
                    {generatingSEO ? t('adminToolDetail.regenerating') : t('adminToolDetail.regenerateSEO')}
                  </button>
                  <button
                    onClick={() => handleReview('PUBLISHED')}
                    className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition"
                  >
                    {t('adminToolDetail.publishNow')}
                  </button>
                </>
              ) : (
                // 已发布或已拒绝
                <button
                  onClick={() => handleReview('PENDING')}
                  className="px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
                >
                  {t('adminToolDetail.markAsPending')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacer to avoid content being covered by fixed bar */}
      <div className="h-24"></div>

      {/* Rejection reason modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('adminToolDetail.provideRejectionReason')}</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t('adminToolDetail.rejectionReasonPlaceholder')}
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">
                {t('adminToolDetail.rejectionTip')}
              </p>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason(tool.rejection_reason || '');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleReject}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition"
              >
                {t('adminToolDetail.confirmRejection')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminToolDetail;
