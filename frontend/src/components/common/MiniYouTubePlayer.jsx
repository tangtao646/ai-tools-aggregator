import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import YouTube from 'react-youtube';

// -------------------------------------------------------------------
// 辅助常量 (与 useVideoController 保持一致)
// -------------------------------------------------------------------
const VIDEO_STATE = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
};

/**
 * 迷你 YouTube 播放器 (画中画浮窗)
 * * @param {object} props
 * @param {string} props.videoId - YouTube 视频 ID
 * @param {function} props.onClose - 用户手动点击关闭时调用 (触发 Controller.stopPiP(true))
 * @param {number} [props.startTime=0] - 视频开始播放的时间点 (用于同步进度)
 * @param {object} props.playerRef - 用于将 YouTube 实例传回给 Controller 的 Ref
 * @param {function} props.onStateChange - 用于将播放状态变化汇报给 Controller
 */
const MiniYouTubePlayer = ({ 
    videoId, 
    onClose, 
    startTime = 0, 
    playerRef, 
    onStateChange 
}) => {
    const [isLarge, setIsLarge] = useState(false);
    // 初始位置设置在右下角
    const [position, setPosition] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 200 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

    // -------------------------------------------------------------------
    // YouTube Player 逻辑
    // -------------------------------------------------------------------

    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1, // PiP 启动时自动播放
            // 使用 start 参数作为初始同步点，但 onReady seekTo 更精确
            start: Math.floor(startTime), 
            rel: 0, // 不显示相关视频
        },
    };

    // 1. 在 Player Ready 时，将实例传递给 Controller，并进行精确跳转
    const onPlayerReady = useCallback((event) => {
        // 将 YouTube Player 实例保存到 Controller 提供的 ref 中
        if (playerRef) {
            playerRef.current = event.target;
        }
        
        // 使用 seekTo 来跳转到精确的开始时间
        if (startTime > 0) {
            // true 表示允许缓冲，实现更精确的跳转
            event.target.seekTo(startTime, true); 
        }
    }, [playerRef, startTime]);


    // 2. 将播放状态变化汇报给 Controller
    const handleStateChange = useCallback((event) => {
        // 汇报状态 (1=PLAYING, 2=PAUSED, 0=ENDED 等) 给 Controller
        if (onStateChange) {
            onStateChange(event.data);
        }
    }, [onStateChange]);
    
    // 3. 用户手动关闭时的逻辑 (直接调用 Controller 的 onClose/stopPiP(true))
    const handleManualClose = useCallback(async (e) => {
        e.stopPropagation();
        // 尝试稳健地停止/清理内嵌 YouTube 播放器，避免 PiP 状态残留
        try {
            if (playerRef && playerRef.current) {
                const p = playerRef.current;
                if (typeof p.pauseVideo === 'function') {
                    p.pauseVideo();
                }
                if (typeof p.stopVideo === 'function') {
                    // stopVideo 可能会抛，如果不可用则忽略
                    try { p.stopVideo(); } catch (err) { /* ignore */ }
                }
                // 清理引用，避免 controller 中读取到过期实例
                try { playerRef.current = null; } catch (err) { /* ignore */ }
            }

            // 如果进入了浏览器的 Picture-in-Picture，尝试安全退出
            if (document.pictureInPictureElement) {
                try { await document.exitPictureInPicture(); } catch (err) { /* ignore */ }
            }
        } catch (err) {
            console.warn('Error while closing mini player:', err);
        }

        // Controller 会在 stopPiP(true) 内部负责获取 MiniPlayer 的最终状态
        onClose(); 
    }, [onClose, playerRef]);

    // -------------------------------------------------------------------
    // 拖动逻辑
    // -------------------------------------------------------------------

    const handleMouseDown = useCallback((e) => {
        // 确保只响应鼠标左键点击
        if (e.button !== 0) return;
        e.preventDefault(); 
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y,
        };
    }, [position.x, position.y]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            
            // 边界检查 (防止完全拖出屏幕)
            let newX = dragRef.current.initialX + dx;
            let newY = dragRef.current.initialY + dy;
            
            // 限制左边界
            newX = Math.max(0, newX);
            // 限制上边界
            newY = Math.max(0, newY);
            // 限制右边界 (使用当前尺寸来计算)
            const width = isLarge ? 640 : 320;
            newX = Math.min(window.innerWidth - width, newX);
            // 限制下边界
            const height = (isLarge ? 360 : 180) + 28; // 28px 是标题栏高度
            newY = Math.min(window.innerHeight - height, newY);


            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isLarge]);

    // -------------------------------------------------------------------
    // 渲染
    // -------------------------------------------------------------------

    if (!videoId) return null;

    // 使用 Portal 渲染到 body，确保 z-index 和 fixed 定位有效
    return ReactDOM.createPortal(
        <div
            className={`fixed z-[9999] bg-black rounded-xl shadow-2xl transition-all duration-300 overflow-hidden ${isLarge ? 'w-[640px] h-[388px]' : 'w-[320px] h-[208px]'}`}
            style={{ 
                left: `${position.x}px`, 
                top: `${position.y}px`,
                // 拖动时增加光标样式
                cursor: isDragging ? 'grabbing' : 'auto'
            }}
        >
            {/* 拖动把手和控制按钮 (高度 28px) */}
            <div
                className="h-7 bg-gray-800 flex items-center justify-between px-3 cursor-grab text-white text-sm flex-shrink-0"
                onMouseDown={handleMouseDown}
            >
                <span>YouTube Player</span>
                <div className='flex items-center'>
                    <button onClick={() => setIsLarge(prev => !prev)} className="mr-2 hover:text-primary transition-colors focus:outline-none">
                        {isLarge ? '⧉' : '❐'} {/* 放大/缩小图标 */}
                    </button>
                    <button onClick={handleManualClose} className="hover:text-red-500 transition-colors focus:outline-none">
                        X
                    </button>
                </div>
            </div>

            {/* 视频主体 (iframe) */}
            <YouTube
                videoId={videoId}
                opts={opts}
                onReady={onPlayerReady} // 绑定实例和进度同步
                onStateChange={handleStateChange} // 绑定状态汇报
                className="w-full h-full"
            />
        </div>,
        document.body // 渲染到 body 
    );
};

export default MiniYouTubePlayer;