
import React, { useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface UploadZoneProps {
    onFileSelect: (file: File) => void;
    currentPreview: string | null;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, currentPreview }) => {
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                onFileSelect(files[0]);
            }
        },
        [onFileSelect]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                onFileSelect(files[0]);
            }
        },
        [onFileSelect]
    );

    return (
        <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
        relative w-full aspect-square md:aspect-video rounded-xl 
        border-2 border-dashed transition-all duration-300 group cursor-pointer overflow-hidden
        ${currentPreview
                    ? 'border-yellow-500/50 bg-black/40'
                    : 'border-red-400/30 bg-red-950/20 hover:border-yellow-500/50 hover:bg-red-900/30'
                }
      `}
        >
            <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            />

            {currentPreview ? (
                <div className="w-full h-full relative group">
                    <img
                        src={currentPreview}
                        alt="Upload preview"
                        className="w-full h-full object-contain p-2"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white z-20 pointer-events-none">
                        <Upload className="w-8 h-8 mb-2 text-yellow-400" />
                        <p className="font-medium text-yellow-100">点击或拖拽更换图片</p>
                        <p className="text-xs text-yellow-100/60 mt-1">Change Photo</p>
                    </div>
                </div>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-red-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-red-500/30">
                        <ImageIcon className="w-8 h-8 text-yellow-500/80" />
                    </div>
                    <p className="text-lg font-bold text-yellow-100/90 mb-1">
                        点击或拖拽上传照片
                    </p>
                    <p className="text-sm text-red-200/60">
                        支持 JPG, PNG 格式
                    </p>
                    <p className="text-xs text-red-300/40 mt-4">
                        Upload Photo (JPG/PNG)
                    </p>
                </div>
            )}
        </div>
    );
};

export default UploadZone;
