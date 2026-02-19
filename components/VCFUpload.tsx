import React, { useRef, useState } from 'react';
import { Upload, Plus, AlertCircle, FileText } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface VCFUploadProps {
  onFileSelect: (file: File) => void;
  onError?: (error: string) => void;
}

const VCFUpload: React.FC<VCFUploadProps> = ({ onFileSelect, onError }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5000 * 1024 * 1024; // Updated to 5GB as per UI text

  const validateFile = (file: File) => {
    setError(null);
    if (!file.name.endsWith('.vcf') && !file.name.endsWith('.fastq')) {
      const msg = "Invalid file type. Please upload a .vcf or .fastq file.";
      setError(msg);
      onError?.(msg);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      const msg = "File too large. Max size is 5GB.";
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
        onFileSelect(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
    if (e.target) e.target.value = '';
  };

  return (
    <div 
      className={cn(
        "flex-1 flex flex-col items-center justify-center relative z-10 w-full h-full",
        dragActive ? "scale-[1.02]" : ""
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".vcf,.fastq"
        onChange={handleChange}
      />
      
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-[#007AFF]/20 blur-xl rounded-full scale-150 animate-pulse"></div>
        <div className="relative size-24 rounded-[24px] bg-gradient-to-br from-white to-gray-50 shadow-lg border border-white flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
           {error ? <AlertCircle className="text-red-500" size={40} /> : <Plus className="text-[#007AFF]" size={40} />}
        </div>
      </div>

      <h3 className="text-2xl font-bold text-[#1D1D1F] mb-2 text-center font-display">
        {error ? 'Validation Error' : 'Drag & Drop Sequence'}
      </h3>
      <p className="text-[#86868b] text-center text-sm mb-8 max-w-[200px] leading-relaxed">
        {error || 'Support for .VCF and .FASTQ files up to 5GB.'}
      </p>

      <button 
        onClick={() => inputRef.current?.click()}
        className="bg-gradient-to-r from-[#007AFF] to-blue-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
      >
        <Upload className="text-lg" size={18} />
        Select File
      </button>

      {dragActive && (
        <div className="absolute inset-0 bg-brand-blue/5 border-2 border-dashed border-brand-blue rounded-3xl flex items-center justify-center pointer-events-none z-20">
          <div className="flex flex-col items-center gap-2">
            <FileText size={48} className="text-brand-blue animate-bounce" />
            <span className="text-brand-blue font-bold uppercase text-xs tracking-widest">Drop here</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VCFUpload;