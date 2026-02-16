import React, { useState } from 'react';
import { UploadedFileState, GeneratedContent, GenerationStatus } from './types';
import UploadZone from './components/UploadZone';
import ResultDisplay from './components/ResultDisplay';
import { Wand2, Video, Image as ImageIcon, Sparkles, Clock, Facebook, Instagram, Linkedin, ExternalLink } from 'lucide-react';

// Hardcoded prompts for the specific 2026 Horse Year theme
const IMAGE_PROMPT = "把这张图片变成2026马年新春风格。保留人物主要特征，但让背景和服饰充满节日氛围。添加大红灯笼、金色骏马装饰元素、绚丽的烟花背景、红色剪纸。整体画面喜庆洋洋，色彩鲜艳（红色和金色为主），高质量，高细节，电影感光效，3D皮克斯风格或高保真摄影风格。";
const VIDEO_PROMPT = "2026马年新春贺岁视频。画面中有骏马奔腾的意象（光影或剪纸形式），灯笼在微风中轻轻摇曳，背景有绚丽的烟花不断绽放，金色粒子飘落，喜庆热闹的氛围，cinematic lighting, 4k, slow motion, festive fantasy.";

const IMAGE_WEBHOOK_URL = "https://jooymedia.zeabur.app/webhook/cde2f263-1383-48dd-8fe8-42d324bc9016";
const VIDEO_WEBHOOK_URL = "https://jooymedia.zeabur.app/webhook/cny-generation";

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
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

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

  // Helper function to call webhook with FormData - handles long-running n8n workflows
  const callWebhook = async (
    url: string,
    file: File,
    prompt: string,
    mode: string,
    userName: string,
    userEmail: string,
    onProgress?: (message: string) => void
  ) => {
    // Create FormData as required by n8n webhook
    const formData = new FormData();
    formData.append('data', file);  // CRITICAL: Must be 'data' for n8n webhook
    formData.append('fileName', file.name);
    formData.append('prompt', prompt);
    formData.append('mode', mode);
    formData.append('name', userName);
    formData.append('email', userEmail);

    console.log('📤 Sending request to webhook:', url);
    console.log('📦 File name:', file.name, 'Type:', file.type, 'Size:', file.size);
    console.log('🎨 Mode:', mode, 'Prompt:', prompt.substring(0, 50) + '...');

    onProgress?.('正在上传照片...');

    // Create an AbortController for timeout (3 minutes for long-running workflows)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 seconds timeout

    try {
      onProgress?.(mode === 'video' ? '正在生成视频，预计需要 60-90 秒...' : '正在生成图片，预计需要 30-60 秒...');

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Webhook error response:', errorText);
        throw new Error(`Webhook call failed with status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || '';
      console.log('📋 Response Content-Type:', contentType);

      // Check if response is binary data (image or video)
      if (contentType.startsWith('image/')) {
        console.log('🖼️ Received image binary data');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        console.log('✅ Created blob URL for image:', blobUrl);
        return blobUrl;
      } else if (contentType.startsWith('video/')) {
        console.log('🎬 Received video binary data');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        console.log('✅ Created blob URL for video:', blobUrl);
        return blobUrl;
      } else if (contentType.includes("application/json")) {
        const data = await response.json();
        console.log('✅ Full JSON response:', data);

        // CRITICAL: Detect if the user still has the "Processing" node in n8n
        if (data.status === 'processing') {
          throw new Error(
            'Configuration Error: N8N workflow closed connection too early. \n' +
            'Please remove the "Respond - Processing Started" node in your n8n workflow. \n' +
            'The app needs to wait for the final result.'
          );
        }

        // Try to extract URL from various possible field names
        const possibleUrl = data.url || data.output || data.image || data.video ||
          data.result || data.imageUrl || data.videoUrl ||
          data.file || data.fileUrl || data.downloadUrl;

        if (!possibleUrl) {
          console.warn('⚠️ Could not find URL in response. Available fields:', Object.keys(data));
          console.warn('⚠️ Full response data:', JSON.stringify(data, null, 2));

          // If the response is an object with nested data, try to find URL in nested objects
          for (const key in data) {
            if (typeof data[key] === 'object' && data[key] !== null) {
              const nestedUrl = data[key].url || data[key].output || data[key].image ||
                data[key].video || data[key].result || data[key].downloadUrl;
              if (nestedUrl) {
                console.log('🔍 Found URL in nested field:', key, '→', nestedUrl);
                return nestedUrl;
              }
            }
          }
        } else {
          console.log('🎯 Extracted URL:', possibleUrl);
        }

        return possibleUrl;
      } else {
        // Fallback: try as text
        const textResponse = await response.text();
        console.log('📝 Text response:', textResponse);

        // Check if it's a URL
        if (textResponse.startsWith('http://') || textResponse.startsWith('https://')) {
          return textResponse;
        }

        throw new Error('Unexpected response format');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('请求超时。生成时间超过 3 分钟，请稍后重试。');
      }
      throw error;
    }
  };


  const handleGenerate = async () => {
    if (!fileState.file) {
      setErrorMsg("请先上传照片 (Please upload a photo first)");
      return;
    }

    setStatus(GenerationStatus.LOADING);
    setErrorMsg(null);

    try {
      let url = '';
      const promptToUse = mode === 'image' ? IMAGE_PROMPT : VIDEO_PROMPT;
      const webhookUrl = mode === 'image' ? IMAGE_WEBHOOK_URL : VIDEO_WEBHOOK_URL;

      console.log('🚀 Starting generation...', { mode, webhookUrl });

      // Progress callback for user feedback
      const onProgress = (message: string) => {
        console.log('⏳ Progress:', message);
      };

      // Send the actual file object, not base64
      url = await callWebhook(webhookUrl, fileState.file, promptToUse, mode, userName, userEmail, onProgress);

      if (!url) {
        throw new Error("Received empty response from generation service.");
      }

      console.log('🎉 Generation complete! URL:', url);

      setResult({
        type: mode,
        url,
        prompt: promptToUse,
        createdAt: Date.now(),
      });
      setStatus(GenerationStatus.SUCCESS);
    } catch (e: any) {
      console.error('💥 Generation error:', e);
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
        <div className="mt-6 bg-gradient-to-b from-red-700 to-red-800 border-2 border-yellow-600/50 py-6 px-4 rounded-b-lg shadow-xl flex items-center justify-center">
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
        <div className="mt-6 bg-gradient-to-b from-red-700 to-red-800 border-2 border-yellow-600/50 py-6 px-4 rounded-b-lg shadow-xl flex items-center justify-center">
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
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${mode === 'image'
                  ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg shadow-red-900/50 font-bold border border-red-400/20'
                  : 'text-red-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                <ImageIcon size={20} />
                <span>生成图片 (Image)</span>
              </button>
              <button
                onClick={() => handleModeChange('video')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all ${mode === 'video'
                  ? 'bg-gradient-to-r from-red-700 to-red-600 text-white shadow-lg shadow-red-900/50 font-bold border border-red-400/20'
                  : 'text-red-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Video size={20} />
                <span>生成视频 (Video)</span>
              </button>
            </div>

            {/* User Info Section */}
            <div className="bg-black/30 p-4 rounded-xl mb-6 space-y-4">
              <div>
                <label className="block text-yellow-100/80 text-sm font-bold mb-2">你的名字 (Your Name)</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-red-950/50 border border-red-500/30 rounded-lg p-3 text-yellow-100 placeholder-red-300/30 focus:outline-none focus:border-yellow-500/50"
                  placeholder="请输入你的名字"
                />
              </div>
              <div>
                <label className="block text-yellow-100/80 text-sm font-bold mb-2">你的邮箱 (Your Email)</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-red-950/50 border border-red-500/30 rounded-lg p-3 text-yellow-100 placeholder-red-300/30 focus:outline-none focus:border-yellow-500/50"
                  placeholder="请输入你的邮箱"
                />
              </div>
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
              disabled={status === GenerationStatus.LOADING || !fileState.file || !userName.trim() || !userEmail.trim()}
              className={`
                w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]
                ${status === GenerationStatus.LOADING || !fileState.file || !userName.trim() || !userEmail.trim()
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
                  <span>马LEAD全开</span>
                </>
              )}
            </button>

            {errorMsg && (
              <div className="mt-4 p-4 bg-red-900/80 border border-red-400 rounded-lg text-red-100 text-sm text-center animate-in slide-in-from-top-2 shadow-lg whitespace-pre-wrap">
                {errorMsg.includes('Load failed') || errorMsg.includes('Failed to fetch') ? (
                  <>
                    <p className="font-bold mb-2">⚠️ 网络请求失败 (Network Error)</p>
                    <p>这通常是因为 n8n 响应超时或 CORS 配置问题。</p>
                    <p className="mt-2 text-xs opacity-80">Failed to connect to webhook. If you removed the early response node, ensure your server timeout is {'>'} 90s, or the final node includes CORS headers.</p>
                  </>
                ) : (
                  <>⚠️ {errorMsg}</>
                )}
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
          <div className="mt-8 pt-8 border-t border-red-500/20 text-center">
            <h3 className="text-yellow-400 font-bold mb-6 flex items-center justify-center gap-2">
              <span className="w-8 h-px bg-yellow-500/30"></span>
              关注 AI (Follow Us)
              <span className="w-8 h-px bg-yellow-500/30"></span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              {/* LEAD Socials */}
              <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-red-500/10">
                <p className="text-yellow-200/80 font-bold text-sm mb-2 border-b border-red-500/10 pb-2">LEAD</p>
                <div className="flex flex-col gap-2">
                  <a href="https://www.facebook.com/thelead.io" target="_blank" rel="noopener noreferrer" className="text-red-200/60 hover:text-yellow-400 text-xs flex items-center gap-2 transition-colors">
                    <Facebook size={14} /> Facebook
                  </a>
                  <a href="https://www.instagram.com/theleadio/" target="_blank" rel="noopener noreferrer" className="text-red-200/60 hover:text-yellow-400 text-xs flex items-center gap-2 transition-colors">
                    <Instagram size={14} /> Instagram
                  </a>
                  <a href="https://www.linkedin.com/school/thelead" target="_blank" rel="noopener noreferrer" className="text-red-200/60 hover:text-yellow-400 text-xs flex items-center gap-2 transition-colors">
                    <Linkedin size={14} /> Linkedin
                  </a>
                </div>
              </div>

              {/* JooY Media Socials */}
              <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-red-500/10">
                <p className="text-yellow-200/80 font-bold text-sm mb-2 border-b border-red-500/10 pb-2">JooY Media</p>
                <div className="flex flex-col gap-2">
                  <a href="https://www.facebook.com/jooymedia/" target="_blank" rel="noopener noreferrer" className="text-red-200/60 hover:text-yellow-400 text-xs flex items-center gap-2 transition-colors">
                    <Facebook size={14} /> Facebook
                  </a>
                  <a href="https://www.instagram.com/jooy.media" target="_blank" rel="noopener noreferrer" className="text-red-200/60 hover:text-yellow-400 text-xs flex items-center gap-2 transition-colors">
                    <Instagram size={14} /> Instagram
                  </a>
                  <a href="https://www.linkedin.com/company/jooymedia" target="_blank" rel="noopener noreferrer" className="text-red-200/60 hover:text-yellow-400 text-xs flex items-center gap-2 transition-colors">
                    <Linkedin size={14} /> Linkedin
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Decorative Bottom Elements */}
      <div className="fixed bottom-0 left-0 w-full h-2 bg-gradient-to-r from-red-800 via-yellow-500 to-red-800 z-50"></div>
    </div>
  );
}

export default App;