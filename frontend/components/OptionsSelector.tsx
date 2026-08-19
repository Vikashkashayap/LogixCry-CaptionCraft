import React from 'react';
import { CaptionStyle, LanguageOption } from '../types';
import { Languages, Palette, Check, Sparkles, Flame, Film, Zap, Heart, Shield } from 'lucide-react';

interface OptionsSelectorProps {
  language: LanguageOption;
  setLanguage: (lang: LanguageOption) => void;
  captionStyle: CaptionStyle;
  setCaptionStyle: (style: CaptionStyle) => void;
  disabled?: boolean;
}

export const OptionsSelector: React.FC<OptionsSelectorProps> = ({
  language,
  setLanguage,
  captionStyle,
  setCaptionStyle,
  disabled,
}) => {
  const languages: { id: LanguageOption; label: string; sub: string; badge: string; icon: string }[] = [
    { id: 'auto', label: 'Auto Detect', sub: 'AI identifies spoken language', badge: 'Smart AI', icon: '🌐' },
    { id: 'English', label: 'English', sub: 'Standard English transcript', badge: 'Universal', icon: '🇺🇸' },
    { id: 'Hindi', label: 'Hindi (हिन्दी)', sub: 'Devanagari script transcription', badge: 'Devanagari', icon: '🇮🇳' },
    { id: 'Hinglish', label: 'Hinglish', sub: 'Hindi spoken in Latin letters', badge: 'Roman Script', icon: '✨' },
  ];

  const styles: {
    id: CaptionStyle;
    label: string;
    badge: string;
    icon: React.ReactNode;
    fontFamily: string;
    textColor: string;
    textShadow: string;
    bgTag: string;
    desc: string;
  }[] = [
    {
      id: 'bold',
      label: 'Bold Social',
      badge: 'Viral Reels',
      icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
      fontFamily: 'font-black tracking-wide uppercase',
      textColor: 'text-[#FFE600]',
      textShadow: 'drop-shadow-[0_2px_4px_rgba(0,0,0,1)] [text-shadow:_0_2px_0_#000,_0_-2px_0_#000,_2px_0_0_#000,_-2px_0_0_#000]',
      bgTag: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      desc: 'High-impact yellow font with heavy black stroke for TikTok & Reels',
    },
    {
      id: 'classic',
      label: 'Classic Cinema',
      badge: 'Standard',
      icon: <Film className="w-3.5 h-3.5 text-slate-300" />,
      fontFamily: 'font-bold tracking-normal',
      textColor: 'text-white',
      textShadow: 'drop-shadow-[0_2px_3px_rgba(0,0,0,1)] [text-shadow:_0_1.5px_0_#000,_0_-1.5px_0_#000,_1.5px_0_0_#000,_-1.5px_0_0_#000]',
      bgTag: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
      desc: 'Clean crisp white text with solid outline for YouTube & vlogs',
    },
    {
      id: 'highlight',
      label: 'Electric Cyan',
      badge: 'High Contrast',
      icon: <Zap className="w-3.5 h-3.5 text-cyan-400" />,
      fontFamily: 'font-extrabold tracking-wider uppercase',
      textColor: 'text-[#00FFFF]',
      textShadow: 'drop-shadow-[0_0_8px_rgba(0,255,255,0.6)] [text-shadow:_0_2px_0_#000,_0_-2px_0_#000,_2px_0_0_#000,_-2px_0_0_#000]',
      bgTag: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      desc: 'Vivid glowing cyan for maximum visibility and tech videos',
    },
    {
      id: 'cyber',
      label: 'Cyber Magenta',
      badge: 'Vibrant Trend',
      icon: <Heart className="w-3.5 h-3.5 text-pink-400" />,
      fontFamily: 'font-black tracking-wide uppercase',
      textColor: 'text-[#FF1493]',
      textShadow: 'drop-shadow-[0_0_8px_rgba(255,20,147,0.6)] [text-shadow:_0_2px_0_#000,_0_-2px_0_#000,_2px_0_0_#000,_-2px_0_0_#000]',
      bgTag: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
      desc: 'Hot neon pink typography for aesthetic & lifestyle content',
    },
    {
      id: 'reels',
      label: 'Reels Lime',
      badge: 'Shorts Hit',
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
      fontFamily: 'font-black tracking-wider uppercase',
      textColor: 'text-[#00FF66]',
      textShadow: 'drop-shadow-[0_2px_4px_rgba(0,0,0,1)] [text-shadow:_0_2px_0_#000,_0_-2px_0_#000,_2px_0_0_#000,_-2px_0_0_#000]',
      bgTag: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      desc: 'Punchy electric lime green captions that instantly grab attention',
    },
    {
      id: 'minimal',
      label: 'Minimal Clean',
      badge: 'Pro Modern',
      icon: <Shield className="w-3.5 h-3.5 text-indigo-400" />,
      fontFamily: 'font-medium tracking-tight',
      textColor: 'text-slate-100',
      textShadow: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]',
      bgTag: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      desc: 'Subtle clean subtitle for podcasts, interviews & tutorials',
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* 1. LANGUAGE SELECTOR */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Spoken Language</h3>
              <p className="text-xs text-slate-400">Choose speech language for precise transcription</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {languages.map((lang) => {
            const isSelected = language === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                disabled={disabled}
                onClick={() => setLanguage(lang.id)}
                className={`p-3.5 rounded-xl text-left border transition-all relative flex flex-col justify-between group ${
                  isSelected
                    ? 'border-indigo-500 bg-gradient-to-br from-indigo-500/20 to-violet-500/10 text-white shadow-lg shadow-indigo-500/15 ring-1 ring-indigo-500/40'
                    : 'border-slate-800/90 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:bg-slate-900/80 hover:text-slate-200'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{lang.icon}</span>
                      <span className="font-semibold text-sm text-slate-100">{lang.label}</span>
                    </div>
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700/50">
                        {lang.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{lang.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ENHANCED CAPTION STYLE SELECTOR */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Caption Visual Styles</h3>
              <p className="text-xs text-slate-400">Choose how subtitles will look when burned into your video</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {styles.map((style) => {
            const isSelected = captionStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                disabled={disabled}
                onClick={() => setCaptionStyle(style.id)}
                className={`p-4 rounded-xl text-left border transition-all relative flex flex-col justify-between group overflow-hidden ${
                  isSelected
                    ? 'border-violet-500 bg-gradient-to-br from-violet-500/20 via-slate-900/90 to-indigo-500/10 text-white shadow-xl shadow-violet-500/15 ring-2 ring-violet-500/50'
                    : 'border-slate-800/90 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:bg-slate-900/80 hover:text-slate-200'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {style.icon}
                      <span className="font-semibold text-sm text-slate-100">{style.label}</span>
                    </div>

                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-md shadow-violet-500/40">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${style.bgTag}`}>
                        {style.badge}
                      </span>
                    )}
                  </div>

                  {/* Simulated Video Frame Preview */}
                  <div className="relative w-full h-16 rounded-lg bg-gradient-to-b from-slate-900 to-black border border-slate-800/90 flex items-center justify-center overflow-hidden my-2.5 shadow-inner">
                    {/* Background subtle video mock element */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Caption Preview Text */}
                    <span className={`relative text-sm ${style.fontFamily} ${style.textColor} ${style.textShadow} px-2 text-center`}>
                      THIS IS HOW IT LOOKS
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-1">{style.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
