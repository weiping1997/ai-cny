import React, { useState } from 'react';
import { UploadedFileState, GeneratedContent, GenerationStatus } from './types';
import UploadZone from './components/UploadZone';
import ResultDisplay from './components/ResultDisplay';
import { generateCNYImage, generateCNYVideo } from './services/geminiService';
import { Wand2, Video, Image as ImageIcon, Sparkles, Clock } from 'lucide-react';

// Hardcoded prompts for the specific 2026 Horse Year theme
const IMAGE_PROMPT = "把这张图片变成2026马年新春风格。保留人物主要特征，但让背景和服饰充满节日氛围。添加大红灯笼、金色骏马装饰元素、绚丽的烟花背景、红色剪纸。整体画面喜庆洋洋，色彩鲜艳（红色和金色为主），高质量，高细节，电影感光效，3D皮克斯风格或高保真摄影风格。";
const VIDEO_PROMPT = "2026马年新春贺岁视频。画面中有骏马奔腾的意象（光影或剪纸形式），灯笼在微风中轻轻摇曳，背景有绚丽的烟花不断绽放，金色粒子飘落，喜庆热闹的氛围，cinematic lighting, 4k, slow motion, festive fantasy.";

function App() {
  const [fileState, setFileState] = useState<UploadedFileState>({
    file: null,
    previewUrl: null,
    base64: null,
    mimeType: '',
  });

  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'image' | 'video'>('image');

  // Handle file selection
  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const base64Data = e.target.result as string;
        // Extract pure Base64 for API (remove data:image/xxx;base64,)
        const base64Content = base64Data.split(',')[1];
        
        setFileState({
          file,
          previewUrl: base64Data,
          base64: base64Content,
          mimeType: file.type,
        });
        setResult(null); // Clear previous result
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Toggle mode
  const handleModeChange = (newMode: 'image' | 'video') => {
    setMode(newMode);
    setErrorMsg(null);
  };

  const handleGenerate = async () => {
    if (!fileState.base64 || !fileState.mimeType) {
      setErrorMsg("请先上传照片 (Please upload a photo first)");
      return;
    }

    setStatus(GenerationStatus.LOADING);
    setErrorMsg(null);

    try {
      let url = '';
      // Use the hardcoded prompts based on mode
      const promptToUse = mode === 'image' ? IMAGE_PROMPT : VIDEO_PROMPT;

      if (mode === 'image') {
        url = await generateCNYImage(fileState.base64, fileState.mimeType, promptToUse);
      } else {
        url = await generateCNYVideo(fileState.base64, fileState.mimeType, promptToUse);
      }

      setResult({
        type: mode,
        url,
        prompt: promptToUse,
        createdAt: Date.now(),
      });
      setStatus(GenerationStatus.SUCCESS);
    } catch (e: any) {
      console.error(e);
      setStatus(GenerationStatus.ERROR);
      setErrorMsg(e.message || "生成失败，请稍后重试。");
    }
  };

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 max-w-6xl mx-auto font-sans relative overflow-x-hidden">
      
      {/* Decorative Elements - Top Left */}
      <div className="fixed top-0 left-4 lg:left-10 z-0 hidden md:flex flex-col items-center animate-swing origin-top">
        <div className="w-0.5 h-16 bg-yellow-500/80"></div>
        <div className="w-16 h-16 bg-red-600 border-2 border-yellow-400 rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.5)]">
           <span className="text-yellow-300 font-serif text-3xl -rotate-45 font-bold select-none drop-shadow-md">福</span>
        </div>
        <div className="mt-6 bg-gradient-to-b from-red-700 to-red-800 border-2 border-yellow-600/50 py-4 px-3 rounded-b-lg shadow-xl">
           <div className="writing-vertical text-yellow-400 font-serif text-xl font-bold tracking-[0.5em] select-none">
              吉星高照
           </div>
        </div>
      </div>

      {/* Decorative Elements - Top Right */}
      <div className="fixed top-0 right-4 lg:right-10 z-0 hidden md:flex flex-col items-center animate-swing origin-top" style={{ animationDelay: '1s' }}>
        <div className="w-0.5 h-16 bg-yellow-500/80"></div>
         <div className="w-16 h-16 bg-red-600 border-2 border-yellow-400 rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.5)]">
           <span className="text-yellow-300 font-serif text-3xl -rotate-45 font-bold select-none drop-shadow-md">春</span>
        </div>
        <div className="mt-6 bg-gradient-to-b from-red-700 to-red-800 border-2 border-yellow-600/50 py-4 px-3 rounded-b-lg shadow-xl">
           <div className="writing-vertical text-yellow-400 font-serif text-xl font-bold tracking-[0.5em] select-none">
              马到成功
           </div>
        </div>
      </div>

      {/* Header */}
      <header className="pt-12 pb-10 text-center relative z-10">
        <div className="inline-block p-1 border-2 border-yellow-500/50 rounded-full mb-6 bg-red-950/50 backdrop-blur">
          <div className="bg-red-900 rounded-full p-3">
             <Sparkles className="text-yellow-400 w-8 h-8 animate-pulse" />
          </div>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-yellow-400 mb-4 font-serif drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-wide">
          AI 福气马上来
        </h1>
        <p className="text-yellow-100/90 text-lg md:text-xl font-light tracking-wider drop-shadow-md">
          用 AI，把你的个人照变成 新春形象照 + 拜年视频
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
        
        {/* Left Column: Input & Controls */}
        <div className="space-y-8">
          
          {/* Upload Section */}
          <div className="bg-red-950/40 p-6 rounded-2xl border border-red-500/30 shadow-2xl backdrop-blur-sm hover:border-yellow-500/30 transition-colors">
            <h2 className="text-xl text-yellow-400 font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full block"></span>
              第一步：上传照片 (Step 1: Upload)
            </h2>
            <UploadZone onFileSelect={handleFileSelect} currentPreview={fileState.previewUrl} />
          </div>

          {/* Configuration Section */}
          <div className="bg-red-950/40 p-6 rounded-2xl border border-red-500/30 shadow-2xl backdrop-blur-sm hover:border-yellow-500/30 transition-colors">
             <h2 className="text-xl text-yellow-400 font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full block"></span>
              第二步：选择魔法 (Step 2: Choose Magic)
            </h2>
            
            {/* Mode Toggle */}
            <div className="flex bg-black/30 p-1 rounded-xl mb-6">
              <button
                onClick={() => handleModeChange('image')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${
                  mode === 'image' 
                    ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg shadow-red-900/50 font-bold border border-red-400/20' 
                    : 'text-red-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <ImageIcon size={20} />
                <span>生成图片 (Image)</span>
              </button>
              <button
                onClick={() => handleModeChange('video')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${
                  mode === 'video' 
                    ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg shadow-red-900/50 font-bold border border-red-400/20' 
                    : 'text-red-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Video size={20} />
                <span>生成视频 (Video)</span>
              </button>
            </div>

             {/* Disclaimer */}
            {mode === 'video' && (
              <div className="mb-6 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                 <Clock className="text-yellow-400 shrink-0 mt-1" size={18} />
                 <div className="text-sm text-yellow-100/90 leading-relaxed">
                    <span className="font-bold text-yellow-400">注意：</span> 视频生成大约需要 30 秒到 1 分钟，稍微等一下，马上就好～
                 </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={status === GenerationStatus.LOADING || !fileState.base64}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]
                ${status === GenerationStatus.LOADING || !fileState.base64
                  ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600'
                  : 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-red-950 hover:from-yellow-400 hover:to-yellow-300 border border-yellow-300/50 shadow-yellow-500/20'
                }
              `}
            >
              {status === GenerationStatus.LOADING ? (
                 <>
                   <div className="w-5 h-5 border-2 border-red-900 border-t-transparent rounded-full animate-spin"></div>
                   <span>施法中...</span>
                 </>
              ) : (
                 <>
                   <Wand2 size={24} />
                   <span>马力马力Home</span>
                 </>
              )}
            </button>
            
            {errorMsg && (
              <div className="mt-4 p-4 bg-red-900/80 border border-red-400 rounded-lg text-red-100 text-sm text-center animate-in slide-in-from-top-2 shadow-lg">
                ⚠️ {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="flex flex-col h-full min-h-[500px]">
           <div className="bg-red-950/40 p-6 rounded-2xl border border-red-500/30 shadow-2xl backdrop-blur-sm flex-grow flex flex-col hover:border-yellow-500/30 transition-colors">
              <h2 className="text-xl text-yellow-400 font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-8 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full block"></span>
                成果展示 (Result)
              </h2>
              
              <div className="flex-grow flex flex-col justify-center">
                <ResultDisplay 
                  content={result} 
                  loading={status === GenerationStatus.LOADING}
                  type={mode}
                  loadingMessage={mode === 'video' ? "正在渲染新春动画 (这可能需要 1-2 分钟)..." : "正在绘制新春贺图..."}
                />
              </div>
           </div>
           
           {/* Footer Note */}
           <div className="mt-6 text-center text-red-200/60 text-xs">
              <p>Powered by LEAD</p>
              <p className="mt-1">Designed for Horseh 2026</p>
           </div>
        </div>

      </div>
      
      {/* Decorative Bottom Elements */}
      <div className="fixed bottom-0 left-0 w-full h-2 bg-gradient-to-r from-red-800 via-yellow-500 to-red-800 z-50"></div>
    </div>
  );
}

export default App;