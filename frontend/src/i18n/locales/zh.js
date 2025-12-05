export default {
  common: {
    appName: 'AI工具集合',
    submit: '提交',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    save: '保存',
    back: '返回',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    search: '搜索',
    filter: '筛选',
    all: '全部',
    close: '关闭',
    backToHome: '返回首页',
    approve: '通过',
    reject: '拒绝',
  },

  header: {
    login: '登录',
    logout: '登出',
    submitTool: '+ 提交工具',
    mySubmissions: '我的提交',
    toggleDarkMode: '切换深色模式',
  },

  footer: {
    copyright: '© 2025 AI工具集合。保留所有权利。',
  },

  home: {
    title: '发现最佳 AI 工具',
    subtitle: '探索并找到满足您需求的完美 AI 工具',
    searchPlaceholder: '搜索 AI 工具...',
    clear: '清除',
    noToolsFound: '未找到工具',
    tryDifferent: '尝试不同的搜索词或筛选条件',
    clearSearch: '清除搜索',
    loadingTools: '加载工具中...',
    loadError: '加载工具失败，请稍后重试',
    error: '加载出错',
    errorLoadingTools: '加载工具失败',
    featured: '精选',
    viewDetails: '查看详情',
    allPricing: '全部价格',
    ratingAll: '全部评分',
    rating4Plus: '4+',
    rating3Plus: '3+',
    rating2Plus: '2+',
  },

  toolDetail: {
    coreDescription: '核心描述',
    platforms: '平台',
    updated: '更新',
    rating: '评分',
    prosConsTitle: '优缺点',
    pros: '优点',
    cons: '缺点',
    faqTitle: '常见问题',
    features: '主要功能',
    useCases: '使用场景',
    pricing: '价格',
    pricingModel: '定价模式',
    visit: '访问',
    errorLoadingTool: '加载工具出错',
    toolNotFound: '未找到 ID 为 {toolId} 的工具。',
    unableToConnect: '无法连接到服务器或获取工具详情。',
    untitledTool: '未命名工具',
    uncategorized: '未分类',
    noDescription: '暂无描述。',
    visitTool: '访问 {name}',
    loadingDetails: '加载详情中...',
    errorLoading: '加载错误',
    fetchError: '获取工具详情失败',
    keyDifferentiators: '关键差异',
    alternatives: '替代工具',
    featured: '精选',
    notSpecified: '未指定',
  },

  login: {
    welcomeBack: '欢迎回来',
    chooseMethod: '选择您偏好的登录方式',
    continueWith: '使用{provider}登录',
    google: '谷歌',
    github: 'GitHub',
    loggingIn: '登录中...',
    agreeTo: '登录即表示您同意',
    termsOfService: '服务条款',
    and: '和',
    privacyPolicy: '隐私政策',
    errors: {
      termsNotAgreed: '请先同意服务条款和隐私政策',
      googleLoginFailed: 'Google 登录失败，请重试',
      githubLoginFailed: 'GitHub 登录失败，请重试',
    },
  },

  adminLogin: {
    title: '管理员登录',
    subtitle: '登录以管理工具审核',
    username: '用户名',
    password: '密码',
    enterUsername: '请输入用户名',
    enterPassword: '请输入密码',
    loginButton: '登录',
    loggingIn: '登录中...',
    defaultCredentials: '默认账号：admin / admin123',
    errors: {
      loginFailed: '登录失败，请检查用户名和密码',
    },
  },

  adminReview: {
    title: '工具审核管理',
    welcome: '欢迎，{username}',
    
    // 筛选按钮
    contentReview: '内容审核',
    seoReview: 'SEO审核',
    allTools: '全部工具',
    
    // 状态
    statusPending: '待审核',
    statusApprovedPendingSEO: '待生成SEO',
    statusSEOGenerated: 'SEO待审核',
    statusRejected: '已拒绝',
    statusPublished: '已发布',
    
    // 旧字段（兼容）
    pending: '待审核',
    rejected: '不通过',
    approved: '已通过',
    pendingReview: '待审核',
    
    noToolsFound: '暂无工具',
    viewDetails: '查看详情',
    backToReviewList: '返回审核列表',
    reviewThisTool: '审核此工具',
    checkCarefully: '请仔细检查所有信息后进行审核操作',
    reject: '✗ 拒绝（需填写原因）',
    approve: '✓ 审核通过',
    markAsPending: '重新标记为待审核',
    detailedDescription: '详细描述',
    keyFeatures: '主要功能',
    visitWebsite: '访问官网',
    editedTimes: '已修改 {count} 次',
    limitReached: '(已达上限)',
    rejectionReason: '拒绝原因',
    provideRejectionReason: '请填写拒绝原因',
    rejectionPlaceholder: '请详细说明拒绝原因，帮助提交者改进...',
    rejectionTip: '提示：清晰的拒绝原因可以帮助用户更好地改进他们的提交',
    confirmRejection: '确认拒绝',
    confirmApprove: '确认通过此工具吗？',
    confirmPending: '确认待审核此工具吗？',
    reviewSuccess: '审核{status}成功！',
    operationFailed: '操作失败，请重试',
  },

  adminToolDetail: {
    // 状态徽章
    statusPending: '待审核',
    statusApprovedPendingSEO: '内容通过，待生成SEO',
    statusSEOGenerated: 'SEO已生成，待审核',
    statusRejected: '已拒绝',
    statusApproved: '已通过',
    
    // 加载和错误
    loading: '加载中...',
    toolNotFound: '工具未找到',
    failedToLoad: '加载失败，请重试',
    backToList: '返回列表',
    
    // 导航
    backToReviewList: '返回审核列表',
    
    // 工具信息
    editedCount: '已修改 {count} 次',
    limitReached: '(已达上限)',
    visitWebsite: '访问网站',
    
    // 版块标题
    detailedDescription: '详细描述',
    keyFeatures: '主要功能',
    useCases: '使用场景',
    pricingDetails: '定价详情',
    rejectionReason: '拒绝原因',
    
    // SEO 内容展示
    generatedSEOContent: '自动生成的 SEO 内容',
    metaTitle: 'SEO 标题',
    metaDescription: 'SEO 描述',
    pros: '优点',
    cons: '缺点',
    faqs: '常见问题',
    
    // 审核操作
    reviewThisTool: '审核此工具',
    checkAllInfo: '审核前请仔细检查所有信息',
    reject: '✗ 拒绝',
    rejectSEO: '✗ 拒绝SEO内容',
    approve: '✓ 通过',
    approveAndGenerateSEO: '✓ 通过并生成SEO',
    generateSEO: '🤖 生成SEO内容',
    generating: '生成中...',
    regenerateSEO: '🔄 重新生成',
    regenerating: '重新生成中...',
    publishNow: '✓ 发布',
    markAsPending: '标记为待审核',
    
    // 确认对话框
    confirmApprove: '确认通过此工具？',
    confirmMarkPending: '确认标记为待审核？',
    confirmGenerateSEO: '确认生成SEO内容？这将调用AI生成元数据、优缺点和FAQ。',
    reviewSuccess: '审核{action}成功！',
    operationFailed: '操作失败，请重试',
    
    // SEO 生成
    seoGeneratedSuccess: 'SEO内容已生成，请审核后发布！',
    seoGenerationFailed: 'SEO生成失败：{error}',
    
    // 拒绝弹窗
    provideRejectionReason: '请提供拒绝原因',
    rejectionReasonPlaceholder: '请详细说明拒绝此提交的原因，以帮助提交者改进...',
    rejectionReasonRequired: '请提供拒绝原因',
    rejectionTip: '提示：清晰的拒绝原因有助于用户更好地改进他们的提交',
    confirmRejection: '确认拒绝',
  },

  toolForm: {
    create: {
      title: '提交新的 AI 工具',
      subtitle: '与社区分享一个优秀的 AI 工具',
      submitButtonText: '提交工具',
      submittingText: '提交中...',
      successTitle: '提交成功！',
      successMessage: '您的工具已成功提交，正在等待审核。我们会尽快审核您的提交。',
      successButtonText: '前往我的提交',
      successRedirect: '/',
    },
    edit: {
      title: '编辑 AI 工具',
      subtitle: '修改您提交的工具信息（编辑后将重新进入审核流程）',
      submitButtonText: '更新工具',
      submittingText: '更新中...',
      successTitle: '更新成功！',
      successMessage: '您的工具已成功更新，将重新进入审核流程。我们会尽快审核您的提交。',
      successButtonText: '返回我的提交',
      successRedirect: '/my-submissions',
    },
    // 表单标签
    backButton: '返回',
    toolLogo: '工具 Logo',
    toolName: '工具名称',
    required: '*',
    category: '分类',
    selectCategory: '请选择分类',
    shortDescription: '简短描述',
    shortDescriptionCount: '({count}/12 个字符)',
    detailedDescription: '详细描述',
    websiteUrl: '网站 URL',
    tags: '标签',
    keyFeatures: '主要功能',
    useCases: '使用场景',
    yourEmail: '您的邮箱',
    emailHint: '(用于接收审核通知)',
    pricingInformation: '定价信息',
    pricingModel: '定价模式',
    pricingDetails: '定价详情',
    
    // 占位符
    toolNamePlaceholder: '例如：ChatGPT',
    shortDescriptionPlaceholder: '例如：AI 聊天助手',
    detailedDescriptionPlaceholder: '详细描述工具的功能和特点...',
    websiteUrlPlaceholder: 'https://example.com',
    emailPlaceholder: 'your@email.com',
    tagPlaceholder: '输入标签后按回车添加',
    featurePlaceholder: '输入功能后按回车添加',
    useCasePlaceholder: '输入使用场景后按回车添加',
    pricingDetailsPlaceholder: '例如：专业版 $20/月，企业版可咨询',
    
    // 图片上传
    clickToUpload: '点击上传图片',
    imageRequirements: '最大 300KB，推荐 512x512 像素',
    removeImage: '移除图片',
    logoPreview: 'Logo 预览',
    imageError: {
      notImage: '请选择图片文件',
      tooLarge: '图片大小不能超过 300KB',
      dimensions: '图片尺寸不能超过 512x512 像素',
    },
    
    // 操作按钮
    addButton: '添加',
    removeButton: '移除',
    cancelButton: '取消',
    
    // 错误消息
    loadToolError: '加载工具数据失败，请稍后重试',
    editLimitReached: '您已达到编辑次数上限（3 次）',
    validationError: '验证错误：{detail}',
    submitFailed: '{mode}工具失败，请稍后重试',
    
    // 定价模式
    pricingModels: {
      Free: '免费',
      Freemium: '免费增值',
      Usage_based: '按使用付费',
      Subscription: '订阅',
    },
  },

  mySubmissions: {
    title: '我的提交',
    
    // 加载和错误
    loading: '加载中...',
    loginRequired: '请登录以查看提交历史',
    loginExpired: '登录已过期，请重新登录',
    tokenFormatError: 'Token 格式错误，请重新登录。详情：{detail}',
    queryFailed: '查询失败：{detail}',
    backToHomeLogin: '返回首页登录',
    
    // 空状态
    noSubmissions: '您还没有提交任何工具',
    submitNow: '立即提交',
    
    // 列表视图
    totalSubmissions: '共 {count} 条提交',
    
    // 状态
    status: {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝',
    },
    statusIcons: {
      pending: '⏳',
      rejected: '✗',
      approved: '✓',
    },
    
    // 编辑信息
    editedCount: '已修改 {count} 次',
    editLimitReached: '(已达上限)',
    editLimitReachedText: '已达编辑上限',
    rejectionReason: '拒绝原因：',
    editAgain: '再次编辑',
    
    // 提示部分
    tipsTitle: '💡 提示',
    tip1: '• 已通过的项目将不会显示。',
    tip2: '• 被拒绝的工具可以再次编辑（最多 3 次）',
    tip3: '• 通过审核的工具将显示在首页',
    tip4: '• 编辑后工具将重新进入审核流程',
  },

  categories: {
    all: '全部',
    chat: '对话',
    coding: '编程',
    image: '图像',
    video: '视频',
    audio: '音频',
    text: '文本',
    other: '其他',
  },

  pricingModels: {
    all: '全部价格',
    free: '免费',
    freemium: '免费增值',
    paid: '付费',
    subscription: '订阅',
  },
};
