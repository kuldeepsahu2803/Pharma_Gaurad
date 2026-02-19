
import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold">PG</div>
            <h1 className="text-xl font-bold tracking-tight">PharmaGuard <span className="text-blue-400">AI</span></h1>
          </div>
          <nav className="flex gap-4 text-sm font-medium">
            <span className="bg-slate-800 px-3 py-1 rounded-full text-slate-400">RIFT 2026 PS1</span>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        {children}
      </main>
      <footer className="bg-slate-100 border-t border-slate-200 p-6 text-center text-slate-500 text-sm">
        <p>&copy; 2024 PharmaGuard AI - Empowering Precision Medicine</p>
      </footer>
    </div>
  );
};

export default Layout;
