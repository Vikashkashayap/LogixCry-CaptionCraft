import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/60 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto h-[76px] flex items-center justify-between">

        {/* Left Side */}
        <div className="flex items-center gap-5">

          {/* LogixCry Logo */}
          <div className="flex items-center shrink-0">
            <img
              src="/LogixCry_logo.png"
              alt="LogixCry"
              style={{ maxHeight: 62, maxWidth: 220 }}
              className="
                h-[54px]
                sm:h-[62px]
                w-auto
                object-contain
                mix-blend-screen
              "
            />
          </div>


        </div>

        {/* Right Side */}
        <div className="flex items-center">

          <div className="
            hidden md:flex
            items-center
            gap-2
            px-3.5
            py-2
            rounded-xl
            bg-slate-900/60
            border border-slate-800/80
            text-slate-400
            text-xs
            sm:text-sm
          ">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />

            <span>
              Secure Server Processing
            </span>
          </div>

        </div>

      </div>
    </header>
  );
};