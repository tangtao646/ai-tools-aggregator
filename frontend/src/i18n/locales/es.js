export default {
  common: {
    appName: 'Herramientas de recopilación de IA',
    submit: 'Enviar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    delete: 'Eliminar',
    edit: 'Editar',
    save: 'Guardar',
    back: 'Volver',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    search: 'Buscar',
    filter: 'Filtrar',
    all: 'Todos',
    close: 'Cerrar',
    backToHome: 'Volver al Inicio',
    approve: 'aprobar',
    reject: 'rechazar',
  },

  header: {
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    submitTool: '+ Enviar Herramienta',
    mySubmissions: 'Mis Envíos',
    toggleDarkMode: 'Cambiar Modo Oscuro',
  },

  footer: {
    copyright: '© 2025 AI Collection Hub. All rights reserved.',
  },

  home: {
    title: 'Descubre las Mejores Herramientas de IA',
    subtitle: 'Explora y encuentra las herramientas de IA perfectas para tus necesidades',
    searchPlaceholder: 'Buscar herramientas de IA...',
    noToolsFound: 'No se encontraron herramientas',
    tryDifferent: 'Prueba diferentes términos de búsqueda o filtros',
    clearSearch: 'Limpiar Búsqueda',
    loadingTools: 'Cargando herramientas...',
    loadError: 'Error al cargar herramientas, por favor intenta de nuevo más tarde',
    error: 'Error al cargar',
    errorLoadingTools: 'Error al cargar herramientas',
    featured: 'Destacado',
    viewDetails: 'Ver Detalles',
  },

  toolDetail: {
    coreDescription: 'Descripción Principal',
    features: 'Características',
    useCases: 'Casos de Uso',
    pricing: 'Precios',
    pricingModel: 'Modelo de Precios',
    visit: 'Visitar',
    errorLoadingTool: 'Error al Cargar Herramienta',
    toolNotFound: 'Herramienta con ID {toolId} no encontrada.',
    unableToConnect: 'No se puede conectar al servidor o recuperar detalles de la herramienta.',
    untitledTool: 'Herramienta Sin Título',
    uncategorized: 'Sin Categoría',
    noDescription: 'No hay descripción disponible.',
    visitTool: 'Visitar {name}',
    loadingDetails: 'Cargando detalles...',
    errorLoading: 'Error de carga',
    fetchError: 'Error al obtener detalles de la herramienta',
    keyDifferentiators: 'Diferenciadores Clave',
    alternatives: 'Alternativas',
    featured: 'Destacado',
    notSpecified: 'No especificado',
  },

  login: {
    welcomeBack: 'Bienvenido de Nuevo',
    chooseMethod: 'Elige tu método de inicio de sesión preferido',
    continueWith: 'Continuar con {provider}',
    google: 'Google',
    github: 'GitHub',
    loggingIn: 'Iniciando sesión...',
    agreeTo: 'Al iniciar sesión, aceptas nuestros',
    termsOfService: 'Términos de Servicio',
    and: 'y',
    privacyPolicy: 'Política de Privacidad',
    errors: {
      termsNotAgreed: 'Por favor acepta los Términos de Servicio y la Política de Privacidad primero',
      googleLoginFailed: 'Error al iniciar sesión con Google, por favor intenta de nuevo',
      githubLoginFailed: 'Error al iniciar sesión con GitHub, por favor intenta de nuevo',
    },
  },

  adminLogin: {
    title: 'Inicio de Sesión de Administrador',
    subtitle: 'Inicia sesión para gestionar revisiones de herramientas',
    username: 'Usuario',
    password: 'Contraseña',
    enterUsername: 'Ingresa el usuario',
    enterPassword: 'Ingresa la contraseña',
    loginButton: 'Iniciar Sesión',
    loggingIn: 'Iniciando sesión...',
    defaultCredentials: 'Credenciales por defecto: admin / admin123',
    errors: {
      loginFailed: 'Error al iniciar sesión, por favor verifica tu usuario y contraseña',
    },
  },

  adminReview: {
    title: 'Gestión de Revisión de Herramientas',
    welcome: 'Bienvenido, {username}',
    pending: 'Pendientes',
    allTools: 'Todas las Herramientas',
    rejected: 'Rechazadas',
    approved: 'Aprobadas',
    pendingReview: 'Revisión Pendiente',
    noToolsFound: 'No se encontraron herramientas',
    viewDetails: 'Ver Detalles',
    backToReviewList: 'Volver a la Lista de Revisión',
    reviewThisTool: 'Revisar esta herramienta',
    checkCarefully: 'Por favor verifica toda la información cuidadosamente antes de revisar',
    reject: 'Rechazar (Se requiere razón)',
    approve: 'Aprobar',
    markAsPending: 'Marcar como Revisión Pendiente',
    detailedDescription: 'Descripción Detallada',
    keyFeatures: 'Características Principales',
    visitWebsite: 'Visitar Sitio Web',
    editedTimes: 'Editado {count} vez/veces',
    limitReached: '(Límite alcanzado)',
    rejectionReason: 'Razón del Rechazo',
    provideRejectionReason: 'Por favor proporciona la razón del rechazo',
    rejectionPlaceholder: 'Por favor explica en detalle por qué este envío está siendo rechazado para ayudar al remitente a mejorar...',
    rejectionTip: 'Consejo: Las razones de rechazo claras ayudan a los usuarios a mejorar mejor sus envíos',
    confirmRejection: 'Confirmar Rechazo',
    confirmApprove: '¿Confirmar aprobar esta herramienta?',
    confirmPending: '¿Confirmar marcar como pendiente esta herramienta?',
    reviewSuccess: '¡Revisión {status} exitosa!',
    operationFailed: 'Operación fallida, por favor intenta de nuevo',
  },

  adminToolDetail: {
    // Status badges
    statusPending: 'Revisión Pendiente',
    statusRejected: 'Rechazada',
    statusApproved: 'Aprobada',

    // Loading and errors
    loading: 'Cargando...',
    toolNotFound: 'Herramienta no encontrada',
    failedToLoad: 'Error al cargar, por favor intenta de nuevo',
    backToList: 'Volver a la Lista',

    // Navigation
    backToReviewList: 'Volver a la Lista de Revisión',

    // Tool info
    editedCount: 'Editado {count} vez/veces',
    limitReached: '(Límite alcanzado)',
    visitWebsite: 'Visitar Sitio Web',

    // Section titles
    detailedDescription: 'Descripción Detallada',
    keyFeatures: 'Características Principales',
    useCases: 'Casos de Uso',
    pricingDetails: 'Detalles de Precios',
    rejectionReason: 'Razón del Rechazo',

    // Review actions
    reviewThisTool: 'Revisar esta herramienta',
    checkAllInfo: 'Por favor verifica toda la información cuidadosamente antes de revisar',
    reject: '✗ Rechazar (Se requiere razón)',
    approve: '✓ Aprobar',
    markAsPending: 'Marcar como Revisión Pendiente',

    // Confirmation dialogs
    confirmApprove: '¿Confirmar aprobar esta herramienta?',
    confirmMarkPending: '¿Confirmar marcar como pendiente esta herramienta?',
    reviewSuccess: '¡Revisión {action} exitosa!',
    operationFailed: 'Operación fallida, por favor intenta de nuevo',

    // Reject modal
    provideRejectionReason: 'Por favor proporciona la razón del rechazo',
    rejectionReasonPlaceholder: 'Por favor explica en detalle por qué este envío está siendo rechazado para ayudar al remitente a mejorar...',
    rejectionReasonRequired: 'Por favor proporciona una razón del rechazo',
    rejectionTip: 'Consejo: Las razones de rechazo claras ayudan a los usuarios a mejorar mejor sus envíos',
    confirmRejection: 'Confirmar Rechazo',
  },

  toolForm: {
    create: {
      title: 'Enviar Nueva Herramienta de IA',
      subtitle: 'Comparte una increíble herramienta de IA con la comunidad',
      submitButtonText: 'Enviar Herramienta',
      submittingText: 'Enviando...',
      successTitle: '¡Envío Exitoso!',
      successMessage: 'Tu herramienta ha sido enviada exitosamente y está esperando revisión. Revisaremos tu envío lo antes posible.',
      successButtonText: 'Volver al Inicio',
      successRedirect: '/',
    },
    edit: {
      title: 'Editar Herramienta de IA',
      subtitle: 'Modifica la información de tu herramienta enviada (volverá a entrar en el proceso de revisión después de editar)',
      submitButtonText: 'Actualizar Herramienta',
      submittingText: 'Actualizando...',
      successTitle: '¡Actualización Exitosa!',
      successMessage: 'Tu herramienta ha sido actualizada exitosamente y volverá a entrar en el proceso de revisión. Revisaremos tu envío lo antes posible.',
      successButtonText: 'Volver a Mis Envíos',
      successRedirect: '/my-submissions',
    },
    // Form Labels
    backButton: 'Volver',
    toolLogo: 'Logo de la Herramienta',
    toolName: 'Nombre de la Herramienta',
    required: '*',
    category: 'Categoría',
    selectCategory: 'Por favor selecciona una categoría',
    shortDescription: 'Descripción Corta',
    shortDescriptionCount: '({count}/12 caracteres)',
    detailedDescription: 'Descripción Detallada',
    websiteUrl: 'URL del Sitio Web',
    tags: 'Etiquetas',
    keyFeatures: 'Características Principales',
    useCases: 'Casos de Uso',
    yourEmail: 'Tu Correo Electrónico',
    emailHint: '(para recibir notificaciones de revisión)',
    pricingInformation: 'Información de Precios',
    pricingModel: 'Modelo de Precios',
    pricingDetails: 'Detalles de Precios',

    // Placeholders
    toolNamePlaceholder: 'ej., ChatGPT',
    shortDescriptionPlaceholder: 'ej., Asistente de Chat IA',
    detailedDescriptionPlaceholder: 'Describe las características y funcionalidades de la herramienta en detalle...',
    websiteUrlPlaceholder: 'https://ejemplo.com',
    emailPlaceholder: 'tu@email.com',
    tagPlaceholder: 'Ingresa una etiqueta y presiona Enter para agregar',
    featurePlaceholder: 'Ingresa una característica y presiona Enter para agregar',
    useCasePlaceholder: 'Ingresa un caso de uso y presiona Enter para agregar',
    pricingDetailsPlaceholder: 'ej., Versión Pro $20/mes, Plan Empresarial disponible',

    // Image Upload
    clickToUpload: 'Haz clic para subir imagen',
    imageRequirements: 'Máx 300KB, recomendado 512x512 píxeles',
    removeImage: 'Eliminar imagen',
    logoPreview: 'Vista previa del logo',
    imageError: {
      notImage: 'Por favor selecciona un archivo de imagen',
      tooLarge: 'El tamaño de la imagen no puede exceder 300KB',
      dimensions: 'Las dimensiones de la imagen no pueden exceder 512x512 píxeles',
    },

    // Actions
    addButton: 'Agregar',
    removeButton: 'Eliminar',
    cancelButton: 'Cancelar',

    // Error Messages
    loadToolError: 'Error al cargar datos de la herramienta, por favor intenta más tarde',
    editLimitReached: 'Has alcanzado el límite de ediciones (3 veces)',
    validationError: 'Error de validación: {detail}',
    submitFailed: 'Error al {mode} herramienta, por favor intenta más tarde',

    // Pricing Models
    pricingModels: {
      Free: 'Gratis',
      Freemium: 'Freemium',
      Paid: 'Pago',
      Subscription: 'Suscripción',
    },
  },

  mySubmissions: {
    title: 'Mis Envíos',

    // Loading and errors
    loading: 'Cargando...',
    loginRequired: 'Por favor inicia sesión para ver el historial de envíos',
    loginExpired: 'Sesión expirada, por favor inicia sesión de nuevo',
    tokenFormatError: 'Error de formato de token, por favor inicia sesión de nuevo. Detalles: {detail}',
    queryFailed: 'Consulta fallida: {detail}',
    backToHomeLogin: 'Volver al Inicio para Iniciar Sesión',

    // Empty state
    noSubmissions: 'Aún no has enviado ninguna herramienta',
    submitNow: 'Enviar Ahora',

    // List view
    totalSubmissions: 'Total {count} envío(s)',

    // Status
    status: {
      pending: 'Revisión Pendiente',
      approved: 'Aprobada',
      rejected: 'Rechazada',
    },
    statusIcons: {
      pending: '⏳',
      rejected: '✗',
      approved: '✓',
    },

    // Edit info
    editedCount: 'Editado {count} vez/veces',
    editLimitReached: '(límite alcanzado)',
    editLimitReachedText: 'Límite de ediciones alcanzado',
    rejectionReason: 'Razón del Rechazo:',
    editAgain: 'Editar de Nuevo',

    // Tips section
    tipsTitle: '💡 Consejos',
    tip1: '• Los elementos aprobados no se mostrarán.',
    tip2: '• Las herramientas rechazadas se pueden editar de nuevo (hasta 3 veces)',
    tip3: '• Las herramientas aprobadas se mostrarán en la página de inicio',
    tip4: '• Las herramientas volverán a entrar en el proceso de revisión después de editar',
  },

  categories: {
    all: 'Todas',
    chat: 'Chat',
    coding: 'Codificación',
    image: 'Imagen',
    video: 'Video',
    audio: 'Audio',
    text: 'Texto',
    other: 'Otro',
  },

  pricingModels: {
    all: 'Todos los Precios',
    free: 'Gratis',
    freemium: 'Freemium',
    paid: 'Pago',
    subscription: 'Suscripción',
  },
};
