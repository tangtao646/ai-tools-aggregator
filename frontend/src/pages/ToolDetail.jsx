import React, { useState, useEffect, useCallback } from 'react';
import YouTubeEmbed, { extractYouTubeId } from '../components/common/YouTubeEmbed';
import MiniYouTubePlayer from '../components/common/MiniYouTubePlayer';
import { useVideoController } from '../hooks/useVideoController';
import { useParams, useNavigate } from 'react-router-dom';
import SimilarToolCard from '../components/common/SimilarToolCard';
import { toolApi } from '../api/apiClient';
import PageBackground from '../components/common/PageBackground';
import BackButton from '../components/BackButton';
import { useI18n } from '../i18n/I18nContext';

/**
 * AI Tool Detail Page - Design Reference Version
 */
const ToolDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, locale } = useI18n();

  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const embedRef = React.useRef(null);
  const [isEmbedVisible, setIsEmbedVisible] = useState(true);

  const {
    videoId,
    isPlaying,
    isPiPActive,
    currentTime,
    embedPlayerRef,
    miniPlayerRef,
    onPlayerStateChange,
    setIsEmbedPlayerReady,
    startPiP,
    stopPiP,
    wasManuallyClosed,
    setWasManuallyClosed
  } = useVideoController(tool ? tool.video_url : null);

   const handleGoBack = useCallback(() => {
    // history.length > 1 の場合、ユーザーは直前のページから遷移してきた可能性が高い
    if (window.history.length > 1) {
      window.history.back(); // 上一步 (可能是外部网站，如 aicollection.tools) に戻る
    } else {
      // 履歴がない場合や不十分な場合は、サイトのホーム ('/') に安全にリダイレクト
      navigate('/');
    }
  }, [navigate]);

  // Intersection Observer for PiP
  useEffect(() => {
    const currentEmbed = embedRef.current;
    if (!currentEmbed || !videoId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible = entry.isIntersecting;
        setIsEmbedVisible(isVisible);

        // 只有当“不可见” AND “正在播放”时，才开启 PiP
        if (!isVisible && isPlaying && !isPiPActive && !wasManuallyClosed) { // 检查锁定状态
          startPiP();
        }

        // 滚动回视图 AND PiP 正在激活时，关闭 PiP
        else if (isVisible && isPiPActive) {
          stopPiP(false);
          // 当自动关闭 PiP 时，解除手动关闭的锁定
          setWasManuallyClosed(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentEmbed);
    return () => observer.unobserve(currentEmbed);

  }, [videoId, isPlaying, isPiPActive, startPiP, stopPiP, wasManuallyClosed, setWasManuallyClosed]);


  // Fetch Tool Detail
  const fetchToolDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await toolApi.getToolDetail(id, { lang_code: locale });
      let toolData = response.data;

      setTool(toolData);

      // 异步加载同类推荐工具
      try {
        const relatedResp = await toolApi.getRelatedTools(toolData.slug || toolData.id, { lang_code: locale });
        if (relatedResp && relatedResp.data) {
          const alternatives = Array.isArray(relatedResp.data) ? relatedResp.data : [];
          setTool((prev) => ({ ...(prev || toolData), alternatives }));
        }
      } catch (relErr) {
        console.warn('Failed to fetch related tools:', relErr);
      }
    } catch (err) {
      console.error("Error fetching tool detail:", err);
      if (err.response && err.response.status === 404) {
        setError(t('toolDetail.toolNotFound', { toolId: id }));
      } else {
        setError(t('toolDetail.fetchError'));
      }
    } finally {
      setLoading(false);
    }
  }, [id, t]); // 依赖 id 和 t

  const handleAlternativeClick = useCallback(async (alternativeName) => {
    const generateSlug = (text) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[-\s]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    const slug = generateSlug(alternativeName);

    try {
      setLoading(true);
      setError(null);
      const response = await toolApi.getToolDetail(slug, { lang_code: locale });
      setTool(response.data);
      setLoading(false);
      navigate(`/tool/${slug}`, { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Error fetching alternative tool detail:", err);
      setError(`无法找到工具 "${alternativeName}" 的详情`);
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchToolDetail();
  }, [fetchToolDetail]);




  // --- 动态更新页面 Meta 标签 (SEO 优化) ---
  useEffect(() => {
    if (tool) {
      // ... (SEO 逻辑保持不变)
      const pageTitle = tool.meta_title || `${tool.name} - AI Tool Review & Guide`;
      document.title = pageTitle;

      const metaDescription = tool.meta_description ||
        (tool.short_description || tool.description || '').substring(0, 160);

      let descTag = document.querySelector('meta[name="description"]');
      if (!descTag) {
        descTag = document.createElement('meta');
        descTag.name = 'description';
        document.head.appendChild(descTag);
      }
      descTag.content = metaDescription;

      const keywords = [
        tool.name,
        tool.category,
        ...(tool.tags || []),
        'AI Tool',
        'AI'
      ].join(', ');

      let keywordsTag = document.querySelector('meta[name="keywords"]');
      if (!keywordsTag) {
        keywordsTag = document.createElement('meta');
        keywordsTag.name = 'keywords';
        document.head.appendChild(keywordsTag);
      }
      keywordsTag.content = keywords;

      const updateOGTag = (property, content) => {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('property', property);
          document.head.appendChild(tag);
        }
        tag.content = content;
      };

      updateOGTag('og:title', pageTitle);
      updateOGTag('og:description', metaDescription);
      updateOGTag('og:type', 'website');
      if (tool.logo_url) {
        updateOGTag('og:image', tool.logo_url.startsWith('http') ? tool.logo_url : `${window.location.origin}${tool.logo_url}`);
      }

      const updateTwitterTag = (name, content) => {
        let tag = document.querySelector(`meta[name="${name}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.name = name;
          document.head.appendChild(tag);
        }
        tag.content = content;
      };

      updateTwitterTag('twitter:card', 'summary_large_image');
      updateTwitterTag('twitter:title', pageTitle);
      updateTwitterTag('twitter:description', metaDescription);
      if (tool.logo_url) {
        updateTwitterTag('twitter:image', tool.logo_url.startsWith('http') ? tool.logo_url : `${window.location.origin}${tool.logo_url}`);
      }
    }

    return () => {
      document.title = 'AI Tools Aggregator';
    };
  }, [tool]);


  // --- AdSense 广告位渲染/推送优化 ---
  useEffect(() => {
    const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT;
    const ADSENSE_SLOT = import.meta.env.VITE_ADSENSE_SLOT;

    // 只有在配置了客户端和广告位ID，并且工具数据加载完成后才尝试推送
    if (!ADSENSE_CLIENT || !ADSENSE_SLOT || !tool) return;

    // ⭐️ 修正点：缩短延迟时间，确保 <ins> 标签渲染后立即推送
    const t = setTimeout(() => {
      try {
        if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
          // 额外的检查，确保 ins 标签已存在
          if (document.querySelector(`ins[data-ad-slot="${ADSENSE_SLOT}"]`)) {
            window.adsbygoogle.push({});
          }
        }
      } catch (e) {
        console.warn('AdSense push failed', e);
      }
    }, 100); // 100ms 足够等待 DOM 渲染

    return () => clearTimeout(t);
  }, [tool]); // 依赖 tool

  if (loading) {
    return (
      <PageBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-xl text-gray-600 dark:text-gray-400">{t('toolDetail.loadingDetails')}</p>
          </div>
        </div>
      </PageBackground>
    );
  }

  if (error) {
    return (
      <PageBackground>
        <div className="flex items-center justify-center min-h-screen">
          <BackButton onClick={onBack} title={t('common.back') || 'Back'} />
          <div className="text-center bg-white dark:bg-gray-800 shadow-xl rounded-xl max-w-lg mx-auto p-10">
            <p className="text-xl text-red-600 dark:text-red-400 font-semibold mb-4">{t('toolDetail.errorLoading')}</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          </div>
        </div>
      </PageBackground>
    );
  }

  if (!tool) return null;

  // 生成 Schema.org JSON-LD 结构化数据（SEO 优化）
  const generateJsonLd = () => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": tool.meta_title || tool.name,
      "description": tool.meta_description || tool.short_description || tool.description,
      "url": tool.official_link,
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": tool.pricing_model.toLowerCase().includes('free') ? "0" : undefined,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      }
    };

    if (tool.logo_url) {
      jsonLd.image = tool.logo_url.startsWith('http') ? tool.logo_url : `${window.location.origin}${tool.logo_url}`;
    }

    if (tool.rating) {
      jsonLd.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": tool.rating,
        "ratingCount": 1,
        "bestRating": 5,
        "worstRating": 0
      };
    }

    if (tool.features && tool.features.length > 0) {
      jsonLd.featureList = tool.features.join(', ');
    } else if (tool.pros && tool.pros.length > 0) {
      jsonLd.featureList = tool.pros.join(', ');
    }

    if (tool.screenshots && tool.screenshots.length > 0) {
      jsonLd.screenshot = tool.screenshots;
    }

    return jsonLd;
  };

  return (
    <PageBackground>
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateJsonLd()) }}
      />

      <div className="container mx-auto max-w-7xl px-6 pt-20 pb-10">
        <div className="flex flex-col gap-8">
          {/* Back Button */}
          <div>
            <BackButton onClick={handleGoBack} title={t('common.back') || 'Back'} />
          </div>

          {/* Main Layout Container (Tool Header + Content + Ad) */}
          <div className="flex flex-col lg:flex-row gap-8 mt-2">
            {/* Left Column (Tool Header + Content) */}
            <div className="flex-1 flex flex-col gap-12">
              {/* Tool Header (Title and Category only) */}
              <div className="flex flex-col gap-6">
                {/* Title and Category */}
                <div className="flex min-w-72 flex-col gap-3">
                  {/* Logo and Name */}
                  <div className="flex items-center gap-4">
                    {/* Logo - only display when logo_url exists */}
                    {tool.logo_url && (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700/50 flex-shrink-0">
                        <img
                          src={tool.logo_url.startsWith('http') ? tool.logo_url : `http://localhost:8000${tool.logo_url}`}
                          alt={`${tool.name || 'Tool'} logo`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-[#111827] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
                      {tool.meta_title || tool.name}
                    </p>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-normal leading-normal">
                    {tool.category || t('toolDetail.uncategorized')}
                  </p>
                </div>
              </div>

              {/* Main Content Area with Ad */}
              <div className="flex flex-col lg:flex-row gap-8 ">
                {/* Left Column - Main Content */}
                <div className="flex-1 flex flex-col gap-12">
                  {/* Tags */}
                  <div className="flex gap-3 flex-wrap">

                    {tool.pricing_model && (
                      <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-primary dark:bg-primary pl-4 pr-4">
                        <p className="text-white text-sm font-medium leading-normal">{tool.pricing_model}</p>
                      </div>
                    )}

                    {tool.is_featured && (
                      <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-primary/10 dark:bg-primary/20 pl-4 pr-4">
                        <p className="text-primary dark:text-white text-sm font-medium leading-normal">✨ {t('toolDetail.featured')}</p>
                      </div>
                    )}
                    {/* Dynamically render tags */}
                    {tool.tags && tool.tags.map((tag, index) => (
                      <div key={index} className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-200 dark:bg-gray-700 pl-4 pr-4">
                        <p className="text-gray-800 dark:text-gray-200 text-sm font-medium leading-normal">{tag}</p>
                      </div>
                    ))}
                  </div>

                  {/* Platform and Update Time Tags */}
                  <div className="flex gap-3 flex-wrap">
                    {tool.supported_platforms && tool.supported_platforms.length > 0 && (
                      <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-200 dark:bg-gray-700 pl-4 pr-4">
                        <p className="text-gray-800 dark:text-gray-200 text-sm font-medium leading-normal">{t('toolDetail.platforms')}: {tool.supported_platforms.join(', ')}</p>
                      </div>
                    )}
                    {tool.updated_at && (
                      <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-200 dark:bg-gray-700 pl-4 pr-4">
                        <p className="text-gray-800 dark:text-gray-200 text-sm font-medium leading-normal">{t('toolDetail.updated')}: {new Date(tool.updated_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Visit Button */}
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="flex-1">

                      {/* Rating Display (NEW POSITION and STYLING) */}
                      {tool.rating !== null && tool.rating !== undefined && (
                        <div className="flex items-center gap-4 mb-6">
                          <h3 className="text-xl font-bold text-[#111827] dark:text-white">{t('toolDetail.rating')}</h3>
                          <div className="inline-flex items-center gap-2">
                            {/* Star Icons */}
                            <div className="flex gap-1 flex-shrink-0">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className="material-symbols-outlined text-2xl"
                                  style={{
                                    color: star <= Math.round(tool.rating) ? '#FFD700' : '#D1D5DB',
                                    fontVariationSettings: star <= Math.round(tool.rating) ? "'FILL' 1" : "'FILL' 0"
                                  }}
                                >
                                  star
                                </span>
                              ))}
                            </div>
                            {/* Numeric Rating */}
                            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                              {tool.rating.toFixed(1)} / 5.0
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Visit Button (Now below Rating) */}
                      <div className='md:mt-[50px]'>
                        <a
                          href={tool.official_link || '#'}
                          target={tool.official_link ? "_blank" : "_self"}
                          rel={tool.official_link ? "noopener noreferrer" : undefined}
                          className="flex min-w-[84px] max-w-[300px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-6 bg-primary hover:bg-opacity-90 text-white gap-3 text-lg font-bold leading-normal tracking-[0.015em] transition-all transform hover:-translate-y-1"
                        >
                          <span className="truncate">{t('toolDetail.visitTool', { name: tool.name || t('toolDetail.untitledTool') })}</span>
                          <span className="material-symbols-outlined text-xl">open_in_new</span>
                        </a>
                      </div>
                    </div>

                    {/* Video Preview placed to the right of the left column on md+ */}
                    {tool.video_url && (
                      <div className="mt-3 md:w-[400px] md:mr-[150px]">
                        <YouTubeEmbed
                          videoId={videoId}
                          isPiPActive={isPiPActive}
                          embedRef={embedRef}
                          playerRef={embedPlayerRef}
                          onStateChange={(state) => onPlayerStateChange('embed', state)}
                          setIsEmbedPlayerReady={setIsEmbedPlayerReady}
                        />
                      </div>
                    )}
                  </div>


                  {/* Core Description - 紧随上方的 block 之后 */}
                  <section className="pl-6 border-l-4 border-[#14b8a6]">
                    <h3 className="text-2xl font-bold text-[#111827] dark:text-white mb-4">{t('toolDetail.coreDescription')}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {tool.meta_description || tool.description}
                    </p>
                  </section>


                  {/* Features */}
                  {tool.features && tool.features.length > 0 && (
                    <section className="pl-6 border-l-4 border-[#14b8a6]">
                      <h3 className="text-2xl font-bold text-[#111827] dark:text-white mb-4">{t('toolDetail.features')}</h3>
                      <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2 leading-relaxed">
                        {tool.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </section>
                  )}


                  {/* Key Differentiators / AI Comparison */}
                  {tool.comparison_data && tool.comparison_data.length > 0 && (
                    <section className="pl-6 border-l-4 border-[#14b8a6]">
                      <h3 className="text-2xl font-bold text-[#111827] dark:text-white mb-4">{t('toolDetail.keyDifferentiators')}</h3>
                      <div className="space-y-6">
                        {tool.comparison_data.map((item, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                            <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{item.title}</p>
                            {item.image_url && (
                              <img src={item.image_url} alt={item.title} className="w-full h-auto rounded-md mb-2" />
                            )}
                            <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                </div>
              </div>

              {/* Use Cases */}
              {tool.use_cases && tool.use_cases.length > 0 && (
                <section className="pl-6 border-l-4 border-[#14b8a6]">
                  <h3 className="text-2xl font-bold text-[#111827] dark:text-white mb-4">{t('toolDetail.useCases')}</h3>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2 leading-relaxed">
                    {tool.use_cases.map((useCase, index) => (
                      <li key={index}>{useCase}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Pricing */}
              <section className="pl-6 border-l-4 border-[#14b8a6]">
                <h3 className="text-2xl font-bold text-[#111827] dark:text-white mb-4">{t('toolDetail.pricing')}</h3>
                {tool.pricing_details ? (
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {tool.pricing_details}
                  </p>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t('toolDetail.pricingModel')}: {tool.pricing_model || t('toolDetail.notSpecified')}
                  </p>
                )}
              </section>
            </div>

            {/* Right Column - Ad Space */}
            <aside className="hidden lg:block w-[160px] flex-shrink-0">
              <div className="sticky top-24 bg-gray-100 dark:bg-gray-800 rounded-xl p-6 border-2 border-dashed border-gray-300 dark:border-gray-600">
                {/* Render AdSense slot when configured via env vars, otherwise show placeholder */}
                <div className="flex items-center justify-center">
                  {/* ⭐️ 修正点：调整 ins 标签样式和格式以适应固定尺寸 */}
                  <ins
                    className="adsbygoogle"
                    style={{ display: 'block' }} // ⭐️ 仅保留 display: block
                    data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT}
                    data-ad-slot={import.meta.env.VITE_ADSENSE_SLOT}
                    data-ad-format="auto" // 允许 AdSense 根据 250px 的宽度自动决定高度
                    data-full-width-responsive="true">
                  </ins>

                </div>
              </div>
            </aside>
          </div>

          {/* Pros & Cons */}
          {((tool.pros && tool.pros.length > 0) || (tool.cons && tool.cons.length > 0)) && (
            <section className="mt-6 pl-6 border-l-4 border-[#14b8a6]">
              <h3 className="text-2xl font-bold text-[#111827] dark:text-white mb-6">{t('toolDetail.prosConsTitle')}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pros Column */}
                {tool.pros && tool.pros.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">
                        check_circle
                      </span>
                      <h4 className="text-xl font-semibold text-green-800 dark:text-green-300">{t('toolDetail.pros')}</h4>
                    </div>
                    <ul className="space-y-3">
                      {tool.pros.map((pro, index) => (
                        <li key={index} className="flex items-start gap-2 text-green-700 dark:text-green-200">
                          <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0">
                            add_circle
                          </span>
                          <span className="leading-relaxed">{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cons Column */}
                {tool.cons && tool.cons.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border-2 border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">
                        cancel
                      </span>
                      <h4 className="text-xl font-semibold text-red-800 dark:text-red-300">{t('toolDetail.cons')}</h4>
                    </div>
                    <ul className="space-y-3">
                      {tool.cons.map((con, index) => (
                        <li key={index} className="flex items-start gap-2 text-red-700 dark:text-red-200">
                          <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0">
                            remove_circle
                          </span>
                          <span className="leading-relaxed">{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* FAQ Section */}
          {tool.faqs && tool.faqs.length > 0 && (
            <section className="mt-6 pl-6 border-l-4 border-[#14b8a6]">
              <h3 className="text-2xl font-bold text-[#111827] dark:text-white mb-6">{t('toolDetail.faqTitle')}</h3>
              <div className="space-y-4">
                {tool.faqs.map((faq, index) => (
                  <details key={index} className="group bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <summary className="cursor-pointer list-none px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex-1">
                          {faq.question}
                        </h4>
                        <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 group-open:rotate-180 transition-transform">
                          expand_more
                        </span>
                      </div>
                    </summary>
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}


          {/* Alternatives / Competitors Recommendation */}
          {tool.alternatives && tool.alternatives.length > 0 && (
            <section className="mt-6 pl-6 border-l-4 border-[#14b8a6]">
              <h3 className="text-2xl font-bold text-[#111827] dark:text-white mb-6">{t('toolDetail.alternatives')}</h3>
              <div className="grid grid-cols-3 gap-4">
                {tool.alternatives.map((alternative, index) => (
                  <SimilarToolCard
                    key={alternative.slug || alternative.id || index}
                    tool={alternative}
                    onClick={(identifier) => handleAlternativeClick(identifier)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Mini YouTube Player for PiP */}
      {isPiPActive && (
        <MiniYouTubePlayer
          videoId={videoId}
          startTime={currentTime}
          onClose={() => {
            //console.log("MiniPlayer: Manual Close Triggered.");
            stopPiP(true);
          }}
          playerRef={miniPlayerRef}
          onStateChange={(state) => onPlayerStateChange('mini', state)}
        />)}
    </PageBackground>
  );
};

export default ToolDetail;