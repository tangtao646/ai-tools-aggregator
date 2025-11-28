import React, { useCallback } from 'react';
import YouTube from 'react-youtube';

/**
 * 从 YouTube URL 中提取 Video ID
 * @param {string} url - 完整的 YouTube 视频链接
 * @returns {string | null} - 提取到的 Video ID 或 null
 */
export const extractYouTubeId = (url) => {
    if (!url) return null;

    // 匹配常见的 YouTube URL 格式
    const regExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:.+)?$/;

    const match = url.match(regExp);

    if (match && match[1].length === 11) {
        return match[1];
    }

    return null;
};


/**
 * YouTube 嵌入式播放器组件
 * @param {object} props
 * @param {string} props.videoId - 已经提取好的 YouTube 视频 ID
 * @param {boolean} props.isPiPActive - 画中画模式是否激活
 * @param {React.RefObject} props.embedRef - 用于 Intersection Observer 的引用
 * @param {React.RefObject} props.playerRef - 用于将 YouTube 实例传回给 Controller 的 Ref
 * @param {function} props.onStateChange - 用于将播放状态变化汇报给 Controller
 */
const YouTubeEmbed = ({
    videoId,
    isPiPActive,
    embedRef,
    playerRef,
    onStateChange,
    setIsEmbedPlayerReady
}) => {

    if (!videoId) {
        // 如果没有视频 ID，显示一个友好的占位符
        return (
            <div
                ref={embedRef}
                className="w-full aspect-video flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-xl"
            >
                <p className="text-red-500 dark:text-red-400 font-medium">视频链接无效或缺失。</p>
            </div>
        );
    }

    // 当 PiP 浮窗激活时，在内容区显示一个占位符，以实现视觉上的“视频消失”
    if (isPiPActive) {
        return (
            <div
                ref={embedRef}
                className="w-full aspect-video flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl"
            >
                <p className="text-gray-500 dark:text-gray-400">视频正在画中画浮窗中播放...</p>
            </div>
        );
    }

    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 0, // 初始不自动播放
            rel: 0, // 避免显示相关视频
        },
    };

    // 1. Player Ready 事件：将实例传回 Controller
    const onPlayerReady = useCallback((event) => {
        if (playerRef) {
            playerRef.current = event.target; // event.target 是 YouTube Player 实例
        }
        if (setIsEmbedPlayerReady) {
            setIsEmbedPlayerReady(true);
        }
        // 注意：这里我们不 seekTo，因为 seekTo 逻辑由 Controller 在 PiP 关闭后执行
    }, [playerRef, setIsEmbedPlayerReady]);

    // 2. 状态变化事件：汇报给 Controller
    const handleStateChange = useCallback((event) => {
        if (onStateChange) {
            onStateChange(event.data);
        }
    }, [onStateChange]);


    return (
        <div ref={embedRef} className="w-full aspect-video">
            <YouTube
                videoId={videoId}
                opts={opts}
                className="w-full h-full"
                iframeClassName="w-full h-full rounded-xl" // 为 iframe 添加圆角
                onReady={onPlayerReady}
                onStateChange={handleStateChange} // 绑定状态汇报
            />
        </div>
    );
};

export default YouTubeEmbed;