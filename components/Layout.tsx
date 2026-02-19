import React from 'react';
import { Microscope, Dna } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0F1117] text-[#F0F2F8]">
      <header className="h-[60px] border-b border-[#2E3147] bg-[#0F1117]/80 backdrop-blur-md sticky top-0 z-[60] px-6">
        <div className="h-full max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4F8EF7] rounded-lg flex items-center justify-center text-white">
              <Microscope size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest uppercase flex items-center gap-2">
                PharmaGuard <span className="text-[#4F8EF7]">AI</span>
              </h1>
              <p className="text-[10px] text-[#555A72] font-mono leading-none mt-0.5">PRECISION MEDICINE v1.0</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1D27] border border-[#2E3147] text-[10px] font-bold text-[#8B90A7] uppercase tracking-widest">
              <Dna size={12} className="text-[#4F8EF7]" />
              RIFT 2026 PS1 PROTOCOL
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {children}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1117]/95 backdrop-blur-sm border-t border-[#2E3147] px-6 py-2">
        <p className="text-[11px] text-[#555A72] text-center leading-relaxed">
          ⚕️ PharmaGuard AI is a <strong className="text-[#8B90A7]">clinical decision support tool</strong> — not a substitute for professional medical judgment. All AI-generated recommendations require clinician review before patient application. For investigational use only.
        </p>
      </footer>
    </div>
  );
};

export default Layout;