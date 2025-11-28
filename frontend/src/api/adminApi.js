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
