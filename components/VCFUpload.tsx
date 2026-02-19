
import React, { useRef, useState } from 'react';

interface VCFUploadProps {
  onFileSelect: (file: File) => void;
}

const VCFUpload: React.FC<VCFUploadProps> = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-xl p-10 transition-all text-center ${
        dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 bg-white'
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
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        
        {fileName ? (
          <div>
            <p className="text-slate-900 font-semibold">{fileName}</p>
            <button 
              onClick={() => inputRef.current?.click()}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Change file
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-slate-800">Upload Patient VCF</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Drag and drop your genetic data file (VCF v4.2) here to begin analysis. Max size 5MB.
            </p>
            <button 
              onClick={() => inputRef.current?.click()}
              className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm"
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
