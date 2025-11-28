import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toolApi } from '../api/apiClient.js';
import PageBackground from '../components/common/PageBackground';
import BackButton from '../components/BackButton';
import { CATEGORIES } from '../constants/categories';
import { useI18n } from '../i18n/I18nContext';

const ToolForm = ({ mode = 'create', toolId = null, onBack }) => {
    // mode: 'create' | 'edit'
    const { t } = useI18n();
    const isEditMode = mode === 'edit';
    
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [imageError, setImageError] = useState('');

    // 表单数据
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        description: '',
        official_link: '',
        short_description: '',
        tags: [],
        features: [],
        use_cases: [],
        supported_platforms: [],
        pricing_model: 'Free',
        pricing_details: '',
        submitter_email: ''
    });

    const [currentTag, setCurrentTag] = useState('');
    const [currentFeature, setCurrentFeature] = useState('');
    const [currentUseCase, setCurrentUseCase] = useState('');

    // 动态内容配置
    const pageConfig = {
        create: {
            title: t('toolForm.create.title'),
            subtitle: t('toolForm.create.subtitle'),
            submitButtonText: t('toolForm.create.submitButtonText'),
            submittingText: t('toolForm.create.submittingText'),
            successTitle: t('toolForm.create.successTitle'),
            successMessage: t('toolForm.create.successMessage'),
            successButtonText: t('toolForm.create.successButtonText'),
            successRedirect: '/my-submissions'
        },
        edit: {
            title: t('toolForm.edit.title'),
            subtitle: t('toolForm.edit.subtitle'),
            submitButtonText: t('toolForm.edit.submitButtonText'),
            submittingText: t('toolForm.edit.submittingText'),
            successTitle: t('toolForm.edit.successTitle'),
            successMessage: t('toolForm.edit.successMessage'),
            successButtonText: t('toolForm.edit.successButtonText'),
            
        }
    };

    const config = pageConfig[mode];

    const params = useParams();

    // Determine effective tool id: prefer prop, fallback to route param
    const effectiveToolId = toolId || params.id;

    // 加载工具数据（仅编辑模式）
    useEffect(() => {
        if (isEditMode && effectiveToolId) {
            const loadToolData = async () => {
                try {
                    const response = await toolApi.getToolDetail(effectiveToolId);
                    const tool = response.data;
                    
                    console.log('Loaded tool data:', tool);
                    
                    // Ensure supported_platforms is an actual array (backend may return JSON string)
                    let platforms = tool.supported_platforms;
                    if (typeof platforms === 'string') {
                        try {
                            platforms = JSON.parse(platforms);
                        } catch (err) {
                            platforms = [];
                        }
                    }
                    if (!Array.isArray(platforms)) platforms = [];

                    setFormData({
                        name: tool.name || '',
                        category: tool.category || '',
                        description: tool.description || '',
                        official_link: tool.official_link || '',
                        short_description: tool.short_description || '',
                        tags: tool.tags || [],
                        features: tool.features || [],
                        use_cases: tool.use_cases || [],
                        supported_platforms: platforms,
                        pricing_model: tool.pricing_model || '',
                        pricing_details: tool.pricing_details || '',
                        submitter_email: tool.submitter_email || ''
                    });

                    // 如果有 logo，设置预览
                    if (tool.logo_url) {
                        setImagePreview(`http://localhost:8000${tool.logo_url}`);
                    }
                } catch (error) {
                    console.error('Failed to load tool data:', error);
                    alert(t('toolForm.loadToolError'));
                }
            };

            loadToolData();
        }
    }, [effectiveToolId, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 图片相关处理
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        setImageError('');

        if (file) {
            // Check file type
            if (!file.type.startsWith('image/')) {
                setImageError(t('toolForm.imageError.notImage'));
                return;
            }

            // Check file size (300KB = 307200 bytes)
            if (file.size > 307200) {
                setImageError(t('toolForm.imageError.tooLarge'));
                return;
            }

            // Check image dimensions
            const img = new Image();
            img.onload = () => {
                if (img.width > 512 || img.height > 512) {
                    setImageError(t('toolForm.imageError.dimensions'));
                    setSelectedImage(null);
                    setImagePreview('');
                } else {
                    setSelectedImage(file);
                    setImagePreview(URL.createObjectURL(file));
                }
            };
            img.src = URL.createObjectURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        setImagePreview('');
        setImageError('');
    };

    // 标签管理
    const handleAddTag = () => {
        if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, currentTag.trim()]
            }));
            setCurrentTag('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    // Feature 管理
    const handleAddFeature = () => {
        if (currentFeature.trim() && !formData.features.includes(currentFeature.trim())) {
            setFormData(prev => ({
                ...prev,
                features: [...prev.features, currentFeature.trim()]
            }));
            setCurrentFeature('');
        }
    };

    const handleRemoveFeature = (featureToRemove) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter(f => f !== featureToRemove)
        }));
    };

    // Use Case 管理
    const handleAddUseCase = () => {
        if (currentUseCase.trim() && !formData.use_cases.includes(currentUseCase.trim())) {
            setFormData(prev => ({
                ...prev,
                use_cases: [...prev.use_cases, currentUseCase.trim()]
            }));
            setCurrentUseCase('');
        }
    };

    const handleRemoveUseCase = (useCaseToRemove) => {
        setFormData(prev => ({
            ...prev,
            use_cases: prev.use_cases.filter(uc => uc !== useCaseToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. 如果有新图片，先上传
            let logoUrl = null;
            
            if (selectedImage) {
                // 上传新图片
                const uploadResponse = await toolApi.uploadLogo(selectedImage);
                logoUrl = uploadResponse.data.logo_url;
            } else if (imagePreview && imagePreview.startsWith('http://localhost:8000')) {
                // 保留原有图片（仅编辑模式）
                logoUrl = imagePreview.replace('http://localhost:8000', '');
            }

            // 2. 准备提交数据
            // compute category_name (display name) from category key when possible
            const categoryKey = formData.category ? formData.category.toLowerCase() : '';
            let categoryName = formData.category || '';
            if (CATEGORIES.includes(categoryKey)) {
                categoryName = t(`categories.${categoryKey}`);
            }

            // normalize supported_platforms to a real array before sending
            let platforms = formData.supported_platforms;
            if (typeof platforms === 'string') {
                try {
                    platforms = JSON.parse(platforms);
                } catch (err) {
                    platforms = [];
                }
            }
            if (!Array.isArray(platforms)) platforms = [];

            const submitData = {
                name: formData.name,
                description: formData.description,
                short_description: formData.short_description,
                official_link: formData.official_link,
                category: formData.category,
                category_name: categoryName,
                supported_platforms: platforms,
                tags: formData.tags,
                features: formData.features.length > 0 ? formData.features : null,
                use_cases: formData.use_cases.length > 0 ? formData.use_cases : null,
                pricing_model: formData.pricing_model || 'Free',
                pricing_details: formData.pricing_details || null,
                submitter_email: formData.submitter_email,
                logo_url: logoUrl
            };

            console.log(`Sending ${mode} data:`, submitData);

            // 3. 根据模式调用不同 API
            let apiResponse = null;
            if (isEditMode) {
                apiResponse = await toolApi.updateTool(effectiveToolId, submitData);
            } else {
                apiResponse = await toolApi.createTool(submitData);
            }

            console.log('API response:', apiResponse);

            // Only treat as success when response status is 2xx
            const statusCode = apiResponse?.status;
            if (statusCode && statusCode >= 200 && statusCode < 300) {
                setShowSuccessModal(true);
            } else {
                console.error('Unexpected API response status:', statusCode, apiResponse?.data);
                alert(t('toolForm.submitFailed', { mode }));
            }
        } catch (error) {
            console.error(`Failed to ${mode} tool:`, error);
            console.error('Error response:', error.response?.data);

            // Handle different errors
            if (error.response?.status === 403) {
                alert(error.response?.data?.detail || t('toolForm.editLimitReached'));
            } else if (error.response?.status === 422) {
                alert(t('toolForm.validationError', { detail: JSON.stringify(error.response?.data?.detail || 'Invalid data format') }));
            } else {
                alert(t('toolForm.submitFailed', { mode }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        // In edit mode, prefer to go back to the previous page (history) so user returns
        // to where they came from. If an `onBack` prop was provided, call it.
        if (isEditMode) {
            window.history.length > 1 ? window.history.back() : (onBack && onBack());
            return;
        }

        window.location.href = config.successRedirect;
    };

    return (
        <PageBackground>
            <BackButton onClick={onBack} />

            <div className="container mx-auto max-w-4xl px-6 py-12">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                    {/* Title */}
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{config.title}</h1>
                        <p className="text-gray-600 dark:text-gray-400">{config.subtitle}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Logo Upload */}
                        <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                {t('toolForm.toolLogo')}
                            </label>

                            {imagePreview ? (
                                <div className="relative w-[100px] h-[100px] rounded-lg overflow-visible border-2 border-gray-300 bg-gray-100">
                                    <img
                                        src={imagePreview}
                                        alt={t('toolForm.logoPreview')}
                                        className="w-full h-full object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                                        title={t('toolForm.removeImage')}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-blue-200 rounded-lg p-6 hover:border-blue-400 transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('logo-input').click()}
                                >
                                    <span className="material-symbols-outlined text-blue-400 text-5xl mb-2">
                                        add_photo_alternate
                                    </span>
                                    <p className="text-sm text-gray-600 mb-1">{t('toolForm.clickToUpload')}</p>
                                    <p className="text-xs text-gray-500">{t('toolForm.imageRequirements')}</p>
                                </div>
                            )}

                            <input
                                id="logo-input"
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />

                            {imageError && (
                                <p className="mt-2 text-sm text-red-600">{imageError}</p>
                            )}
                        </div>

                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-100">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    {t('toolForm.toolName')} <span className="text-red-500">{t('toolForm.required')}</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder={t('toolForm.toolNamePlaceholder')}
                                />
                            </div>

                            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-100">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    {t('toolForm.category')} <span className="text-red-500">{t('toolForm.required')}</span>
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="">{t('toolForm.selectCategory')}</option>
                                    {CATEGORIES.map(category => (
                                        <option key={category} value={category.charAt(0).toUpperCase() + category.slice(1)}>
                                            {t(`categories.${category}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Short Description */}
                        <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                {t('toolForm.shortDescription')} <span className="text-red-500">{t('toolForm.required')}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                    ({formData.short_description.length} characters, min 20)
                                </span>
                            </label>
                            <input
                                type="text"
                                name="short_description"
                                value={formData.short_description}
                                onChange={handleInputChange}
                                required
                                minLength={20}
                                className="w-full px-4 py-3 text-gray-500  border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                placeholder={t('toolForm.shortDescriptionPlaceholder')}
                            />
                            {formData.short_description.length > 0 && formData.short_description.length < 20 && (
                                <p className="mt-2 text-sm text-red-500">
                                    Short description must be at least 20 characters. ({20 - formData.short_description.length} more needed)
                                </p>
                            )}
                        </div>

                        {/* Detailed Description */}
                        <div className="bg-pink-50 rounded-xl p-6 border-2 border-pink-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                {t('toolForm.detailedDescription')} <span className="text-red-500">{t('toolForm.required')}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                    ({formData.description.length} characters, min 150)
                                </span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                minLength={150}
                                rows={4}
                                className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                                placeholder={t('toolForm.detailedDescriptionPlaceholder')}
                            />
                            {formData.description.length > 0 && formData.description.length < 150 && (
                                <p className="mt-2 text-sm text-red-500">
                                    Detailed description must be at least 150 characters. ({150 - formData.description.length} more needed)
                                </p>
                            )}
                        </div>

                        {/* Website URL */}
                        <div className="bg-indigo-50 rounded-xl p-6 border-2 border-indigo-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                {t('toolForm.websiteUrl')} <span className="text-red-500">{t('toolForm.required')}</span>
                            </label>
                            <input
                                type="url"
                                name="official_link"
                                value={formData.official_link}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder={t('toolForm.websiteUrlPlaceholder')}
                            />
                        </div>

                        {/* Tags */}
                        <div className="bg-orange-50 rounded-xl p-6 border-2 border-orange-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                {t('toolForm.tags')}
                            </label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={currentTag}
                                    onChange={(e) => setCurrentTag(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    className="flex-1 px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    placeholder={t('toolForm.tagPlaceholder')}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    {t('toolForm.addButton')}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="hover:text-orange-600"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Features */}
                        <div className="bg-cyan-50 rounded-xl p-6 border-2 border-cyan-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                {t('toolForm.keyFeatures')}
                            </label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={currentFeature}
                                    onChange={(e) => setCurrentFeature(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                                    className="flex-1 px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                    placeholder={t('toolForm.featurePlaceholder')}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddFeature}
                                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                                >
                                    {t('toolForm.addButton')}
                                </button>
                            </div>
                            <div className="space-y-2">
                                {formData.features.map((feature, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between px-4 py-2 bg-white rounded-lg border border-cyan-200"
                                    >
                                        <span className="text-sm text-gray-700">{feature}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFeature(feature)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            {t('toolForm.removeButton')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Use Cases */}
                        <div className="bg-lime-50 rounded-xl p-6 border-2 border-lime-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                {t('toolForm.useCases')}
                            </label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={currentUseCase}
                                    onChange={(e) => setCurrentUseCase(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUseCase())}
                                    className="flex-1 px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                                    placeholder={t('toolForm.useCasePlaceholder')}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddUseCase}
                                    className="px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-600 transition-colors"
                                >
                                    {t('toolForm.addButton')}
                                </button>
                            </div>
                            <div className="space-y-2">
                                {formData.use_cases.map((useCase, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between px-4 py-2 bg-white rounded-lg border border-lime-200"
                                    >
                                        <span className="text-sm text-gray-700">{useCase}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveUseCase(useCase)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            {t('toolForm.removeButton')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submitter Email */}
                        <div className="bg-teal-50 rounded-xl p-6 border-2 border-teal-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                {t('toolForm.yourEmail')}
                                <span className="text-xs text-gray-500 ml-2">{t('toolForm.emailHint')}</span>
                            </label>
                            <input
                                type="email"
                                name="submitter_email"
                                value={formData.submitter_email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                placeholder={t('toolForm.emailPlaceholder')}
                            />
                        </div>

                        {/* Pricing Details */}
                        <div className="bg-rose-50 rounded-xl p-6 border-2 border-rose-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                {t('toolForm.pricingInformation')}
                            </label>
                            
                            {/* Pricing Model 选择器 */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('toolForm.pricingModel')} 
                                </label>
                                <select
                                    name="pricing_model"
                                    value={formData.pricing_model}
                                    onChange={handleInputChange}
                                    required
                                    className="w-48 px-4 py-3 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                                >
                                    <option value="Free">{t('toolForm.pricingModels.Free')}</option>
                                    <option value="Freemium">{t('toolForm.pricingModels.Freemium')}</option>
                                    <option value="Paid">{t('toolForm.pricingModels.Paid')}</option>
                                    <option value="Subscription">{t('toolForm.pricingModels.Subscription')}</option>
                                </select>
                            </div>
                            
                            {/* Pricing Details 文本框 - 仅在非Free时显示 */}
                            {formData.pricing_model && formData.pricing_model !== 'Free' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('toolForm.pricingDetails')} <span className="text-red-500">{t('toolForm.required')}</span>
                                    </label>
                                    <textarea
                                        name="pricing_details"
                                        value={formData.pricing_details}
                                        onChange={handleInputChange}
                                        required
                                        rows={3}
                                        className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                                        placeholder={t('toolForm.pricingDetailsPlaceholder')}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Submit Buttons */}
                        <div className={`flex gap-4 pt-6 ${isEditMode ? '' : 'justify-end'}`}>
                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                >
                                    {t('toolForm.cancelButton')}
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`${isEditMode ? 'flex-1' : 'w-full'} py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isLoading ? config.submittingText : config.submitButtonText}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-green-600 text-4xl">
                                    check_circle
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{config.successTitle}</h3>
                            <p className="text-gray-600 mb-6">
                                {config.successMessage}
                            </p>
                            <button
                                onClick={handleCloseSuccessModal}
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
                            >
                                {config.successButtonText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageBackground>
    );
};

export default ToolForm;
