import { data } from "react-router-dom";

export default {
  common: {
    appName: 'AI Collection Tools',
    submit: 'Submit',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    back: 'Back',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    close: 'Close',
    backToHome: 'Back to Home',
    approve: 'approve',
    reject: 'reject',
  },

  header: {
    login: 'Login',
    logout: 'Logout',
    submitTool: '+ Submit Tool',
    mySubmissions: 'My Submissions',
    toggleDarkMode: 'Toggle Dark Mode',
  },

  footer: {
    copyright: '© 2025 AI Collection Tools. All rights reserved.',
  },

  home: {
    title: 'Discover the Best AI Tools',
    subtitle: 'Explore and find the perfect AI tools for your needs',
    searchPlaceholder: 'Search AI tools...',
    noToolsFound: 'No tools found',
    tryDifferent: 'Try different search terms or filters',
    clearSearch: 'Clear Search',
    loadingTools: 'Loading tools...',
    loadError: 'Failed to load tools, please try again later',
    error: 'Error loading',
    errorLoadingTools: 'Failed to load tools',
    featured: 'Featured',
    viewDetails: 'View Details',
    allPricing: 'All Pricing',
    ratingAll: 'All Ratings',
    rating4Plus: '4+',
    rating3Plus: '3+',
    rating2Plus: '2+',
  },

  toolDetail: {
    coreDescription: 'Core Description',
    features: 'Features',
    useCases: 'Use Cases',
    pricing: 'Pricing',
    pricingModel: 'Pricing Model',
    visit: 'Visit',
    errorLoadingTool: 'Error Loading Tool',
    toolNotFound: 'Tool with ID {toolId} not found.',
    unableToConnect: 'Unable to connect to server or fetch tool details.',
    untitledTool: 'Untitled Tool',
    uncategorized: 'Uncategorized',
    noDescription: 'No description available.',
    visitTool: 'Visit {name}',
    loadingDetails: 'Loading details...',
    errorLoading: 'Loading error',
    fetchError: 'Failed to fetch tool details',
    keyDifferentiators: 'Key Differentiators',
    alternatives: 'Alternatives',
    featured: 'Featured',
    notSpecified: 'Not specified',
  },

  login: {
    welcomeBack: 'Welcome Back',
    chooseMethod: 'Choose your preferred login method',
    continueWith: 'Continue with {provider}',
    google:'Google',
    github:'GitHub',
    loggingIn: 'Logging in...',
    agreeTo: 'By logging in, you agree to our',
    termsOfService: 'Terms of Service',
    and: 'and',
    privacyPolicy: 'Privacy Policy',
    errors: {
      termsNotAgreed: 'Please agree to the Terms of Service and Privacy Policy first',
      googleLoginFailed: 'Google login failed, please try again',
      githubLoginFailed: 'GitHub login failed, please try again',
    },
  },

  adminLogin: {
    title: 'Admin Login',
    subtitle: 'Login to manage tool reviews',
    username: 'Username',
    password: 'Password',
    enterUsername: 'Enter username',
    enterPassword: 'Enter password',
    loginButton: 'Login',
    loggingIn: 'Logging in...',
    defaultCredentials: 'Default credentials: admin / admin123',
    errors: {
      loginFailed: 'Login failed, please check your username and password',
    },
  },

  adminReview: {
    title: 'Tool Review Management',
    welcome: 'Welcome, {username}',
    
    // Filter buttons
    contentReview: 'Content Review',
    seoReview: 'SEO Review',
    allTools: 'All Tools',
    
    // Status
    statusPending: 'Pending Review',
    statusApprovedPendingSEO: 'Awaiting SEO Generation',
    statusSEOGenerated: 'SEO Review Pending',
    statusRejected: 'Rejected',
    statusPublished: 'Published',
    
    // Old fields (compatibility)
    pending: 'Pending',
    rejected: 'Rejected',
    approved: 'Approved',
    pendingReview: 'Pending Review',
    noToolsFound: 'No tools found',
    viewDetails: 'View Details',
    backToReviewList: 'Back to Review List',
    reviewThisTool: 'Review this tool',
    checkCarefully: 'Please carefully check all information before reviewing',
    reject: 'Reject (Reason required)',
    approve: 'Approve',
    markAsPending: 'Mark as Pending Review',
    detailedDescription: 'Detailed Description',
    keyFeatures: 'Key Features',
    visitWebsite: 'Visit Website',
    editedTimes: 'Edited {count} time(s)',
    limitReached: '(Limit reached)',
    rejectionReason: 'Rejection Reason',
    provideRejectionReason: 'Please provide rejection reason',
    rejectionPlaceholder: 'Please explain in detail why this submission is being rejected to help the submitter improve...',
    rejectionTip: 'Tip: Clear rejection reasons help users better improve their submissions',
    confirmRejection: 'Confirm Rejection',
    confirmApprove: 'Confirm to approve this tool?',
    confirmPending: 'Confirm to mark as pending this tool?',
    reviewSuccess: 'Review {status} successful!',
    operationFailed: 'Operation failed, please try again',
  },

  adminToolDetail: {
    // Status badges
    statusPending: 'Pending Review',
    statusApprovedPendingSEO: 'Content Approved, Awaiting SEO',
    statusSEOGenerated: 'SEO Generated, Pending Review',
    statusRejected: 'Rejected',
    statusApproved: 'Approved',
    
    // Loading and errors
    loading: 'Loading...',
    toolNotFound: 'Tool not found',
    failedToLoad: 'Failed to load, please try again',
    backToList: 'Back to List',
    
    // Navigation
    backToReviewList: 'Back to Review List',
    
    // Tool info
    editedCount: 'Edited {count} time(s)',
    limitReached: '(Limit reached)',
    visitWebsite: 'Visit Website',
    
    // Section titles
    detailedDescription: 'Detailed Description',
    keyFeatures: 'Key Features',
    useCases: 'Use Cases',
    pricingDetails: 'Pricing Details',
    rejectionReason: 'Rejection Reason',
    
    // SEO Content Display
    generatedSEOContent: 'Auto-Generated SEO Content',
    metaTitle: 'SEO Title',
    metaDescription: 'SEO Description',
    pros: 'Pros',
    cons: 'Cons',
    faqs: 'FAQs',
    
    // Review actions
    reviewThisTool: 'Review this tool',
    checkAllInfo: 'Please carefully check all information before reviewing',
    reject: '✗ Reject',
    rejectSEO: '✗ Reject SEO Content',
    approve: '✓ Approve',
    approveAndGenerateSEO: '✓ Approve & Generate SEO',
    generateSEO: '🤖 Generate SEO Content',
    generating: 'Generating...',
    regenerateSEO: '🔄 Regenerate',
    regenerating: 'Regenerating...',
    publishNow: '✓ Publish',
    markAsPending: 'Mark as Pending Review',
    
    // Confirmation dialogs
    confirmApprove: 'Confirm to approve this tool?',
    confirmMarkPending: 'Confirm to mark as pending this tool?',
    confirmGenerateSEO: 'Confirm to generate SEO content? This will use AI to generate metadata, pros & cons, and FAQs.',
    reviewSuccess: 'Review {action} successful!',
    operationFailed: 'Operation failed, please try again',
    
    // SEO Generation
    seoGeneratedSuccess: 'SEO content generated successfully, please review and publish!',
    seoGenerationFailed: 'SEO generation failed: {error}',
    
    // Reject modal
    provideRejectionReason: 'Please provide rejection reason',
    rejectionReasonPlaceholder: 'Please explain in detail why this submission is being rejected to help the submitter improve...',
    rejectionReasonRequired: 'Please provide a rejection reason',
    rejectionTip: 'Tip: Clear rejection reasons help users better improve their submissions',
    confirmRejection: 'Confirm Rejection',
  },

  toolForm: {
    create: {
      title: 'Submit New AI Tool',
      subtitle: 'Share an amazing AI tool with the community',
      submitButtonText: 'Submit Tool',
      submittingText: 'Submitting...',
      successTitle: 'Submission Successful!',
      successMessage: 'Your tool has been submitted successfully and is awaiting review. We will review your submission as soon as possible.',
      successButtonText: 'Go to My Submissions',
      successRedirect: '/',
    },
    edit: {
      title: 'Edit AI Tool',
      subtitle: 'Modify your submitted tool information (will re-enter review process after editing)',
      submitButtonText: 'Update Tool',
      submittingText: 'Updating...',
      successTitle: 'Update Successful!',
      successMessage: 'Your tool has been successfully updated and will re-enter the review process. We will review your submission as soon as possible.',
      successButtonText: 'Back to My Submissions',
      successRedirect: '/my-submissions',
    },
    // Form Labels
    backButton: 'Back',
    toolLogo: 'Tool Logo',
    toolName: 'Tool Name',
    required: '*',
    category: 'Category',
    selectCategory: 'Please select a category',
    shortDescription: 'Short Description',
    shortDescriptionCount: '({count}/12 characters)',
    detailedDescription: 'Detailed Description',
    websiteUrl: 'Website URL',
    tags: 'Tags',
    keyFeatures: 'Key Features',
    useCases: 'Use Cases',
    yourEmail: 'Your Email',
    emailHint: '(for receiving review notifications)',
    pricingInformation: 'Pricing Information',
    pricingModel: 'Pricing Model',
    pricingDetails: 'Pricing Details',
    
    // Placeholders
    toolNamePlaceholder: 'e.g., ChatGPT',
    shortDescriptionPlaceholder: 'e.g., AI Chat Assistant',
    detailedDescriptionPlaceholder: 'Describe the tool\'s features and characteristics in detail...',
    websiteUrlPlaceholder: 'https://example.com',
    emailPlaceholder: 'your@email.com',
    tagPlaceholder: 'Enter a tag and press Enter to add',
    featurePlaceholder: 'Enter a feature and press Enter to add',
    useCasePlaceholder: 'Enter a use case and press Enter to add',
    pricingDetailsPlaceholder: 'e.g., Pro version $20/month, Enterprise plan available',
    
    // Image Upload
    clickToUpload: 'Click to upload image',
    imageRequirements: 'Max 300KB, recommended 512x512 pixels',
    removeImage: 'Remove image',
    logoPreview: 'Logo preview',
    imageError: {
      notImage: 'Please select an image file',
      tooLarge: 'Image size cannot exceed 300KB',
      dimensions: 'Image dimensions cannot exceed 512x512 pixels',
    },
    
    // Actions
    addButton: 'Add',
    removeButton: 'Remove',
    cancelButton: 'Cancel',
    
    // Error Messages
    loadToolError: 'Failed to load tool data, please try again later',
    editLimitReached: 'You have reached the edit limit (3 times)',
    validationError: 'Validation error: {detail}',
    submitFailed: 'Failed to {mode} tool, please try again later',
    
    // Pricing Models
    pricingModels: {
      Free: 'Free',
      Freemium: 'Freemium',
      Usage_based: 'Usage-based',
      Subscription: 'Subscription',
    },
  },

  mySubmissions: {
    title: 'My Submissions',
    
    // Loading and errors
    loading: 'Loading...',
    loginRequired: 'Please log in to view submission history',
    loginExpired: 'Login expired, please log in again',
    tokenFormatError: 'Token format error, please log in again. Details: {detail}',
    queryFailed: 'Query failed: {detail}',
    backToHomeLogin: 'Back to Home to Login',
    
    // Empty state
    noSubmissions: 'You haven\'t submitted any tools yet',
    submitNow: 'Submit Now',
    
    // List view
    totalSubmissions: 'Total {count} submission(s)',
    
    // Status
    status: {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
    },
    statusIcons: {
      pending: '⏳',
      rejected: '✗',
      approved: '✓',
    },
    
    // Edit info
    editedCount: 'Edited {count} time(s)',
    editLimitReached: '(limit reached)',
    editLimitReachedText: 'Edit limit reached',
    rejectionReason: 'Rejection Reason:',
    editAgain: 'Edit Again',
    
    // Tips section
    tipsTitle: '💡 Tips',
    tip1: '• Approved items will not be displayed.',
    tip2: '• Rejected tools can be edited again (up to 3 times)',
    tip3: '• Approved tools will be displayed on the homepage',
    tip4: '• Tools will re-enter the review process after editing',
  },

  categories: {
    all: 'All',
    chat: 'Chat',
    coding: 'Coding',
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    text: 'Text',
    other: 'Other',
  },

  pricingModels: {
    all: 'All Pricing',
    free: 'Free',
    freemium: 'Freemium',
    paid: 'Paid',
    subscription: 'Subscription',
  },


};
