
import React from 'react';
import { GeneratedContent } from '../types';
import { Download, Share2, Loader2, Sparkles } from 'lucide-react';

interface ResultDisplayProps {
    content: GeneratedContent | null;
    loading: boolean;
    type: 'image' | 'video';
    loadingMessage?: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ content, loading, type, loadingMessage }) => {
    if (loading) {
        return (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-red-900/50 border-t-yellow-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                    </div>
                </div>
                <h3 className="mt-8 text-xl font-bold text-yellow-400 animate-pulse">
                    {type === 'video' ? '正在制作新春视频...' : '正在绘制新春贺图...'}
                </h3>
                <p className="mt-3 text-red-200/70 max-w-xs mx-auto leading-relaxed">
                    {loadingMessage || "AI 正在挥洒创意，为您定制专属祝福..."}
                </p>
                {type === 'video' && (
                    <p className="mt-2 text-xs text-yellow-600/60">
                        (视频生成可能需要 1 分钟左右，请耐心等待)
                    </p>
                )}
            </div>
        );
    }

    if (!content) {
        return (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-red-900/30 rounded-xl bg-black/20">
                <div className="w-24 h-24 bg-red-950/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Sparkles className="w-10 h-10 text-red-800/50" />
                </div>
                <h3 className="text-xl font-bold text-red-900/40 mb-2">等待生成</h3>
                <p className="text-red-900/30 text-sm">
                    上传照片并点击“马力马力Home”<br />
                    见证奇迹时刻
                </p>
            </div>
        );
    }

    return (
        <div className="animate-in zoom-in-95 duration-500 w-full h-full flex flex-col">
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-yellow-500/20 group bg-black/40 flex-grow flex items-center justify-center min-h-[300px]">
                {content.type === 'video' ? (
                    <video
                        src={content.url}
                        controls
                        autoPlay
                        loop
                        className="w-full h-full object-contain max-h-[600px]"
                        poster={undefined} // You might want a poster here
                    />
                ) : (
                    <img
                        src={content.url}
                        alt="Generated CNY Art"
                        className="w-full h-full object-contain max-h-[600px]"
                    />
                )}

                {/* Overlay Actions (visible on hover) */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <a
                        href={content.url}
                        download={`cny-2026-${content.type}-${Date.now()}.${content.type === 'video' ? 'mp4' : 'png'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-black/60 hover:bg-yellow-600/80 text-white rounded-full backdrop-blur-md transition-colors shadow-lg"
                        title="Download"
                    >
                        <Download size={20} />
                    </a>
                </div>
            </div>

            <div className="mt-6 flex flex-col items-center animate-slide-in-from-bottom-4 fade-in">
                <h3 className="text-xl font-bold text-yellow-400 mb-2 font-serif tracking-wide">
                    ✨ 福气已送达！ ✨
                </h3>
                <p className="text-red-200/60 text-sm mb-6">
                    快保存下来分享给亲朋好友吧
                </p>

                <a
                    href={content.url}
                    download={`cny-2026-${content.type}-${Date.now()}.${content.type === 'video' ? 'mp4' : 'png'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                px-8 py-3 bg-gradient-to-r from-red-700 to-red-600 
                hover:from-red-600 hover:to-red-500 text-white 
                rounded-full font-bold shadow-lg shadow-red-900/40 
                flex items-center gap-2 transition-all transform hover:scale-105
                border border-red-400/20
             "
                >
                    <Download size={18} />
                    <span>下载原图/视频</span>
                </a>
            </div>
        </div>
    );
};

export default ResultDisplay;
