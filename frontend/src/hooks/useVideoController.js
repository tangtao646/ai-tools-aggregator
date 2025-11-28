import React, { useState, useCallback, useEffect, useRef } from 'react';
import { extractYouTubeId } from '../components/common/YouTubeEmbed'; // 假设你已导出

const VIDEO_STATE = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
};

/**
 * 视频播放控制器 Hook
 * 用于同步嵌入式播放器和画中画播放器之间的状态和进度。
 */
export const useVideoController = (videoUrl) => {
    // 存储当前播放的视频 ID
    const videoId = React.useMemo(() => extractYouTubeId(videoUrl), [videoUrl]);

    // 状态
    const [isPlaying, setIsPlaying] = useState(false); // 视频当前是否处于播放状态
    const [currentTime, setCurrentTime] = useState(0); // 当前播放进度
    const [isPiPActive, setIsPiPActive] = useState(false); // PiP 浮窗是否开启
    const [isEmbedPlayerReady, setIsEmbedPlayerReady] = useState(false);
    const prevIsEmbedPlayerReady = useRef(false);
    const [wasManuallyClosed, setWasManuallyClosed] = useState(false); // 新增状态

    // Player 实例引用 (用于在 PiP 切换时调用方法)
    const embedPlayerRef = React.useRef(null);
    const miniPlayerRef = React.useRef(null);

    // ----------------------------------------------------
    // 1. 播放状态事件处理
    // ----------------------------------------------------

    // 当任意播放器（嵌入式或 PiP）开始播放时调用
    const handlePlayerStateChange = useCallback((playerType, state) => {
        // playerType: 'embed' 或 'mini'
        // 检查是否为播放状态
        const newIsPlaying = (state === VIDEO_STATE.PLAYING || state === VIDEO_STATE.BUFFERING);
        setIsPlaying(newIsPlaying);

        // ⭐️ 核心修正：当嵌入式播放器开始播放时，解除手动关闭的锁定
        // 只有在嵌入式播放器中（而不是 MiniPlayer 中）操作才解除锁定
        if (playerType === 'embed' && newIsPlaying) {
            setWasManuallyClosed(false);
        }
        // 如果是 Playing (1)
        if (state === VIDEO_STATE.PLAYING) {
            setIsPlaying(true);
        }
        // 如果是 Paused (2) 或 Ended (0)
        else if (state === VIDEO_STATE.PAUSED || state === VIDEO_STATE.ENDED) {
            setIsPlaying(false);
        }
    }, [setIsPlaying, setWasManuallyClosed]);

    // ----------------------------------------------------
    // 2. PiP 控制逻辑
    // ----------------------------------------------------

    // PiP 启动：从嵌入式 -> PiP
    const startPiP = useCallback(async () => {
        const embedPlayer = embedPlayerRef.current;

        let time = 0;
        let state = VIDEO_STATE.PAUSED; // 默认状态为暂停

        if (embedPlayer) {
            try {
                // 1. 尝试获取当前时间和播放状态
                if (embedPlayer.getCurrentTime) {
                    time = await embedPlayer.getCurrentTime();
                }
                if (embedPlayer.getPlayerState) {
                    state = await embedPlayer.getPlayerState();
                }

                // 2. 暂停嵌入式播放器 (必须在设置 isPiPActive 之前完成)
                if (embedPlayer.pauseVideo) {
                    embedPlayer.pauseVideo();
                }

                console.log("Paused embed player and got time:", time); // 检查日志

            } catch (e) {
                console.error("Failed to get time/pause embed player:", e);
                // 发生错误时，使用默认值 time=0, state=PAUSED，继续执行 PiP 启动
            }
        }

        // 3. 更新 Controller 状态
        setCurrentTime(time);
        setIsPlaying(state === VIDEO_STATE.PLAYING);

        // 4. ⭐️ 核心修正：在所有 API 调用完成后，才允许 React 卸载嵌入式播放器
        // 这将触发 YouTubeEmbed 切换到占位符
        setIsPiPActive(true);

    }, [videoId]); // 依赖项可能需要根据你的实际状态来定

    // PiP 停止/关闭：从 PiP -> 嵌入式
    const stopPiP = useCallback(async (manualClose = false) => {
        const miniPlayer = miniPlayerRef.current;

        // 默认值：使用上次记录的 currentTime 和 isPlaying 状态
        let time = currentTime;
        let stateIsPlaying = isPlaying;

        // ----------------------------------------------------
        // 1. 尝试获取 MiniPlayer 的最终状态
        // ----------------------------------------------------
        if (miniPlayer) {
            try {
                if (miniPlayer.getCurrentTime) {
                    time = await miniPlayer.getCurrentTime();
                }
                if (miniPlayer.getPlayerState) {
                    const state = await miniPlayer.getPlayerState();
                    stateIsPlaying = (state === VIDEO_STATE.PLAYING || state === VIDEO_STATE.BUFFERING);
                }
                // 暂停 MiniPlayer (为了干净地关闭)
                if (miniPlayer.pauseVideo) {
                    miniPlayer.pauseVideo();
                }

            } catch (e) {
                // 记录错误，但继续执行关闭流程
                console.error("Failed to get final state from mini player, using last known state:", e);
            }
        }

        // 如果浏览器处于 native Picture-in-Picture 模式，尝试退出
        try {
            if (document && document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            }
        } catch (err) {
            // 忽略失败，但记录以便排查
            console.warn('Failed to exit native Picture-in-Picture:', err);
        }

        if (manualClose) {
            setWasManuallyClosed(true);
        }
        // ----------------------------------------------------
        // 2. 强制状态更新 (无条件执行)
        // ----------------------------------------------------

        // a. 更新记录的播放进度和状态
        setCurrentTime(time);
        setIsPlaying(stateIsPlaying);

        // b. ⭐️ 核心：无论上面是否报错，都必须关闭 PiP 状态
        setIsEmbedPlayerReady(false);
        setIsPiPActive(false); // 这一行是关闭 MiniPlayer 的关键

        // 清理 miniPlayerRef，避免残留的实例在后续调用中被错误使用
        try { miniPlayerRef.current = null; } catch (err) {
            console.warn('Error while clearing miniPlayerRef:', err);
        }

    }, [setWasManuallyClosed]);


    // 这个 useEffect 负责在 PiP 关闭后，命令嵌入式播放器跳转进度和恢复状态
    useEffect(() => {
        const becameReady = isEmbedPlayerReady && !prevIsEmbedPlayerReady.current;
        prevIsEmbedPlayerReady.current = isEmbedPlayerReady;
        const embedPlayer = embedPlayerRef.current;

        // 只有当 PiP 刚刚关闭 (isPiPActive: false) 且嵌入式播放器可见时，才执行恢复操作
        if (!isPiPActive && embedPlayer && becameReady) {

            // ⭐️ 关键修正：确保播放器实例的方法存在
            // 1. 跳转进度
            try {
                if (typeof embedPlayer.seekTo === 'function' && currentTime > 0) {
                    embedPlayer.seekTo(currentTime, true);
                    console.log("Seeked embed player to", currentTime, "after PiP close.");
                }

                // 2. 恢复播放状态
                if (isPlaying && typeof embedPlayer.playVideo === 'function') {
                    embedPlayer.playVideo();
                    console.log("Resumed embed player after PiP close.");
                } else if (!isPlaying && typeof embedPlayer.pauseVideo === 'function') {
                    embedPlayer.pauseVideo();
                    console.log("Paused embed player after PiP close.");
                }
            } catch (err) {
                console.warn('Error while syncing embed player after PiP close:', err);
            }

        }

        // 依赖项：不要把 ref.current 当作依赖，使用其标识性的状态
    }, [isPiPActive, isPlaying, currentTime, isEmbedPlayerReady]);

    // ----------------------------------------------------
    // 4. 返回控制器 API
    // ----------------------------------------------------

    return {
        // 状态
        videoId,
        isPlaying,
        isPiPActive,
        currentTime, // 用于 MiniPlayer 初始化

        // Refs (用于组件绑定实例)
        embedPlayerRef,
        miniPlayerRef,

        // 事件回调 (由 YouTube 组件调用)
        onPlayerStateChange: handlePlayerStateChange,

        // 动作
        startPiP,
        stopPiP,
        isEmbedPlayerReady,
        setIsEmbedPlayerReady,
        setWasManuallyClosed,
        wasManuallyClosed
    };
};