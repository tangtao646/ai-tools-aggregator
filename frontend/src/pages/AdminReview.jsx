import { useState, useEffect } from 'react';
import adminApi from '../api/adminApi';
import AdminToolDetail from './AdminToolDetail';
import { useI18n } from '../i18n/I18nContext';

function AdminReview() {
  const { t } = useI18n();
  const [currentView, setCurrentView] = useState('list'); // 'list' or 'detail'
  const [selectedToolId, setSelectedToolId] = useState(null);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, seo-review, all, published, rejected
  const [username, setUsername] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // Current page
  const [totalItems, setTotalItems] = useState(0); // Total items
  const pageSize = 20; // Items per page
  
  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);

  useEffect(() => {
    // Check login status
    if (!adminApi.isLoggedIn()) {
      window.location.href = '/admin/login';
      return;
    }

    setUsername(localStorage.getItem('admin_username') || 'Admin');
    loadTools();
  }, [filter, currentPage]); // Add currentPage dependency

  const loadTools = async () => {
    setLoading(true);
    try {
      const params = {
        offset: (currentPage - 1) * pageSize,
        limit: pageSize
      };
      
      let data;
      
      if (filter === 'pending') {
        // 只显示 PENDING 状态的工具（等待内容审核）
        data = await adminApi.getPendingTools(params);
      } else if (filter === 'seo-review') {
        // 显示需要 SEO 审核的工具（APPROVED_PENDING_SEO 和 SEO_GENERATED）
        const allData = await adminApi.getAllTools(params);
        const seoReviewTools = allData.items.filter(tool => 
          tool.review_status === 'APPROVED_PENDING_SEO' || 
          tool.review_status === 'SEO_GENERATED'
        );
        data = {
          items: seoReviewTools,
          total: seoReviewTools.length
        };
      } else {
        // 显示所有工具
        data = await adminApi.getAllTools(params);
      }
      
      setTools(data.items || []);
      setTotalItems(data.total || 0);
    } catch (error) {
      console.error('Failed to load tools:', error);
      if (error.response?.status === 401) {
        window.location.href = '/admin/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (toolId) => {
    setSelectedToolId(toolId);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedToolId(null);
    loadTools(); // Reload list to update status
  };
  
  // Pagination handler
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages - 1, totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  const handleLogout = () => {
    adminApi.logout();
    window.location.href = '/admin/login';
  };

  const handleBackHome = () => {
    window.location.href = '/';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      0: { text: t('adminReview.pending'), color: 'bg-yellow-100 text-yellow-800' },
      1: { text: t('adminReview.rejected'), color: 'bg-red-100 text-red-800' },
      2: { text: t('adminReview.approved'), color: 'bg-green-100 text-green-800' }
    };
    const config = statusConfig[status] || statusConfig[0];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // If on detail page, show detail component
  if (currentView === 'detail' && selectedToolId) {
    return <AdminToolDetail toolId={selectedToolId} onBack={handleBackToList} />;
  }

  // Otherwise show list page
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">{t('adminReview.title')}</h1>
              <span className="ml-4 text-sm text-gray-500">{t('adminReview.welcome', { username })}</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackHome}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                {t('common.backToHome')}
              </button>
              <button
                onClick={() => { window.location.href = '/admin/datamanage'; }}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                数据管理
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
              >
                {t('header.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setFilter('pending');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🟡 {t('adminReview.contentReview')} {filter === 'pending' && `(${totalItems})`}
            </button>
            <button
              onClick={() => {
                setFilter('seo-review');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'seo-review'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🟣 {t('adminReview.seoReview')} {filter === 'seo-review' && `(${totalItems})`}
            </button>
            <button
              onClick={() => {
                setFilter('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 {t('adminReview.allTools')} {filter === 'all' && `(${totalItems})`}
            </button>
          </div>
        </div>

        {/* Tool list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        ) : tools.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">{t('adminReview.noToolsFound')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tools.map(tool => (
              <div key={tool.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  {/* Tool information */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {tool.logo_url && (
                        <img 
                          src={`http://localhost:8000${tool.logo_url}`} 
                          alt={tool.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{tool.name}</h3>
                        <p className="text-sm text-gray-500">{tool.category}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{tool.short_description}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{tool.description}</p>
                    {tool.website_url && (
                      <a 
                        href={tool.website_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
                      >
                        {t('adminReview.visitWebsite')} →
                      </a>
                    )}
                  </div>

                  {/* Action area */}
                  <div className="ml-6 flex flex-col items-end space-y-3">
                    {getStatusBadge(tool.review_status)}
                    
                    {/* View details button */}
                    <button
                      onClick={() => handleViewDetail(tool.id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {t('adminReview.viewDetails')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination component */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-1">
            {/* Previous page button */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                currentPage === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Page number buttons */}
            {getPageNumbers().map((page, index) => 
              page === '...' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="text-sm font-medium flex h-10 w-10 items-center justify-center rounded-full text-gray-500"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`text-sm font-medium flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    currentPage === page
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )
            )}
            
            {/* Next page button */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                currentPage === totalPages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminReview;
