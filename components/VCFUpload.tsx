
import React, { useRef, useState } from 'react';

interface VCFUploadProps {
  onFileSelect: (file: File) => void;
  onError?: (error: string) => void;
}

const VCFUpload: React.FC<VCFUploadProps> = ({ onFileSelect, onError }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFile = (file: File) => {
    setError(null);
    if (!file.name.endsWith('.vcf')) {
      const msg = "Invalid file type. Please upload a .vcf file.";
      setError(msg);
      onError?.(msg);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      const msg = "File too large. Max size is 5MB per PS1 specification.";
      setError(msg);
      onError?.(msg);
      return false;
    }
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setFileName(file.name);
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setFileName(file.name);
        onFileSelect(file);
      }
    }
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-2xl p-10 transition-all text-center ${
        dragActive ? 'border-blue-500 bg-blue-50/50' : 
        error ? 'border-red-300 bg-red-50/30' : 'border-slate-200 hover:border-slate-300 bg-white'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".vcf"
        onChange={handleChange}
      />
      
      <div className="flex flex-col items-center gap-3">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-colors ${
          error ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-400'
        }`}>
          {error ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>
        
        {fileName ? (
          <div>
            <p className="text-slate-900 font-bold text-lg">{fileName}</p>
            <p className="text-slate-500 text-sm">File ready for analysis</p>
            <button 
              onClick={() => inputRef.current?.click()}
              className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4"
            >
              Select a different file
            </button>
          </div>
        ) : (
          <>
            <h3 className={`text-xl font-black ${error ? 'text-red-700' : 'text-slate-900'}`}>
              {error ? 'Invalid File' : 'Upload Patient VCF'}
            </h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
              {error || 'Drag and drop your genetic data (VCF v4.2) here. Max file size: 5MB.'}
            </p>
            <button 
              onClick={() => inputRef.current?.click()}
              className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
            >
              Browse Files
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VCFUpload;
