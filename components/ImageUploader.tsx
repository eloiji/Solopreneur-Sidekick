
import React, { useState, useRef } from 'react';
import type { UploadedImage } from '../types';

interface ImageUploaderProps {
  onImageUpload: (image: UploadedImage) => void;
  disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, disabled = false }) => {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result?.toString().split(',')[1];
      if (base64String) {
        onImageUpload({ base64: base64String, mimeType: file.type });
        setImagePreviewUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };


  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        disabled={disabled}
        aria-hidden="true"
      />
      <div
        role="button"
        aria-label="Upload product photo"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-lg transition-colors duration-200 bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          disabled 
            ? 'cursor-not-allowed bg-slate-700 opacity-70' 
            : 'cursor-pointer hover:border-indigo-500'
        }`}
      >
        {imagePreviewUrl ? (
          <img src={imagePreviewUrl} alt="Preview of uploaded product" className="max-h-48 rounded-lg object-contain" />
        ) : (
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-500"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-slate-400">
              <p className="pl-1">Click to upload a file</p>
            </div>
            <p className="text-xs text-slate-500">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;