import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/60 py-8 px-4 text-center text-xs text-slate-500 mt-20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p>© {new Date().getFullYear()} CaptionCraft AI. Production-grade Video Processing.</p>
        </div>
        <div className="flex items-center gap-6">
          <span>Powered by Google Gemini 2.5 Flash</span>
          <span>•</span>
          <span>FFmpeg Native Burner</span>
          <span>•</span>
          <span>Next.js & Express</span>
        </div>
      </div>
    </footer>
  );
};
