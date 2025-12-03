// frontend/src/api/apiClient.js
import axios from 'axios';
import { BASE_URL } from '../config/api_config';


const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 导出 axios 实例供其他模块使用
export default apiClient;

/**
 * 封装工具相关的 API 调用
 */
export const toolApi = {
 

  // 获取精简工具列表（用于卡片）
  getToolsCompact: (params = {}) => {
    // Calls the new backend compact endpoint which returns smaller items
    return apiClient.get('/tools/compact', { params });
  },

  // 获取单个工具详情 (用于未来的 ToolDetail.jsx)
  // Accepts optional params (e.g. { lang_code: 'zh' })
  getToolDetail: (toolId, params = {}) => {
    return apiClient.get(`/tools/${toolId}`, { params });
  },

  // 提交新工具（自动携带登录 token）
  createTool: (toolData) => {
    const token = localStorage.getItem('token');
    return apiClient.post('/tools', toolData, {
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : {}
    });
  },

  // 上传 Logo 图片
  uploadLogo: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/tools/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 获取用户提交的工具列表（需要登录）
  getMySubmissions: () => {
    const token = localStorage.getItem('token');
    return apiClient.get('/tools/my-submissions', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  // 更新工具信息（用于编辑审核不通过的工具）
  updateTool: (toolId, toolData) => {
    const token = localStorage.getItem('token');
    return apiClient.patch(`/tools/${toolId}`, toolData, {
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : {}
    });
  }
  ,
  // 获取与指定工具同类的推荐工具（简化列表）
  getRelatedTools: (toolIdOrSlug, params = {}) => {
    return apiClient.get(`/tools/${toolIdOrSlug}/related`, { params });
  }
  ,
  // 获取用于首页展示的去重 display categories
  // Accept optional params object, e.g. { lang_code: 'zh' }
  getDisplayCategories: (params = {}) => {
    return apiClient.get('/tools/display-categories', { params });
  }
};

/**
 * 封装认证相关的 API 调用
 */
export const authApi = {
  // Google 登录
  googleLogin: (accessToken) => {
    return apiClient.post('/auth/google', { access_token: accessToken });
  },

  // GitHub 登录
  githubLogin: (code) => {
    return apiClient.post('/auth/github', { code });
  },

  // 获取当前用户信息
  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    return apiClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
};