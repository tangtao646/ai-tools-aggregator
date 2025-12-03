import apiClient from './apiClient';

const adminApi = {
  /**
   * 管理员登录
   */
  login: async (username, password) => {
    const response = await apiClient.post('/admin/login', {
      username,
      password
    });
    return response.data;
  },

  /**
   * 获取待审核工具列表
   */
  getPendingTools: async (params = {}) => {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get('/admin/tools/pending', {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  /**
   * 获取所有工具（含所有审核状态）
   */
  getAllTools: async (params = {}) => {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.get('/admin/tools/all', {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  /**
   * 更新工具审核状态
   * @param {number} toolId - 工具ID
   * @param {string} reviewStatus - 审核状态（"PENDING"=待审核，"REJECTED"=不通过，"PUBLISHED"=通过）
   * @param {string} rejectionReason - 拒绝原因（仅当 reviewStatus="REJECTED" 时需要）
   */
  updateReviewStatus: async (toolId, reviewStatus, rejectionReason = null) => {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.put(
      `/admin/tools/${toolId}/review`,
      {
        review_status: reviewStatus,
        rejection_reason: rejectionReason
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  },

  /**
   * 检查是否已登录
   */
  isLoggedIn: () => {
    return !!localStorage.getItem('admin_token');
  },

  /**
   * 登出
   */
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
  }
  ,
  /**
   * 上传 seo_tools.json 并导入到后端数据库（需要管理员 token）
   * @param {File} file
   */
  importSeoTools: async (file) => {
    const token = localStorage.getItem('admin_token');
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post('/admin/import-seo', form, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
  ,
  /**
   * Upload file and trigger server-side chunked import using import_tools_auto_split.py
   * @param {File} file - The JSON file to upload
   * @param {string} langCode - Language code for translations (default: 'zh')
   */
  importSeoToolsAutoSplit: async (file, langCode = 'zh') => {
    const token = localStorage.getItem('admin_token');
    const form = new FormData();
    form.append('file', file);
    form.append('lang_code', langCode);
    const response = await apiClient.post('/admin/import-seo-auto-split', form, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
  ,
  /**
   * Generic import for a named table. Backend should expose `/admin/import/:table` accepting multipart file.
   * @param {string} table
   * @param {File} file
   */
  importTable: async (table, file) => {
    const token = localStorage.getItem('admin_token');
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post(`/admin/import/${table}`, form, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Delete all data from a named table. Backend should expose DELETE `/admin/delete/:table` protected by admin token.
   * @param {string} table
   */
  deleteTable: async (table) => {
    const token = localStorage.getItem('admin_token');
    const response = await apiClient.delete(`/admin/delete/${table}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  }
  ,
  /**
   * Trigger server-side resumable translation of an uploaded JSON array.
   * @param {File} file - JSON file (array of objects)
   * @param {string} langCode - target language, e.g. 'zh'
   * @param {string} key - key property for dedupe/resume (default: 'name')
   * @param {number} delay - minimum seconds between LLM calls
   */
  // added optional `signal` for cancellation (AbortController.signal)
  translateTools: async (file, langCode = 'zh', key = 'name', delay = 15, signal = undefined) => {
    const token = localStorage.getItem('admin_token');
    const form = new FormData();
    form.append('file', file);
    form.append('lang_code', langCode);
    form.append('key', key);
    form.append('delay', String(delay));

    const response = await apiClient.post('/admin/translate-tools', form, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'Content-Type': 'multipart/form-data'
      },
      // pass through AbortController signal if provided (axios supports it)
      signal,
    });
    return response.data;
  },
  /**
   * Check if a username corresponds to an admin account.
   * Public endpoint used to avoid hardcoding admin emails in the frontend.
   */
  isAdmin: async (username) => {
    const response = await apiClient.get('/admin/is-admin', { params: { username } });
    return response.data; // { is_admin: true/false }
  }
  ,
  /**
   * Trigger backend category mapping generation (admin only)
   */
  generateCategoryMapping: async (mappingFilePath = undefined, commit = false, mappingOverride = undefined, force = false) => {
    const token = localStorage.getItem('admin_token');
    const query = [];
    if (commit) query.push('commit=true');
    if (force) query.push('force=true');
    if (mappingFilePath) query.push(`mapping_file=${encodeURIComponent(mappingFilePath)}`);
    const url = `/admin/generate-category-mapping${query.length ? `?${query.join('&')}` : ''}`;

    // When committing with an explicit mappingOverride, send that mapping object as the
    // request body directly (FastAPI expects the mapping dict as the body). For preview
    // (commit=false) we send no body to avoid accidentally sending an empty `{}` which
    // could be interpreted as an empty override.
    const data = (commit && mappingOverride && Object.keys(mappingOverride).length > 0)
      ? mappingOverride
      : undefined;

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await apiClient.post(url, data, { headers });
    return response.data;
  }
};

export default adminApi;
