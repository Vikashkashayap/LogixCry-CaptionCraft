'use client';

import React, { useState } from 'react';
import { VideoEditPlan } from '../../types/editor';
import { autoEditApi } from '../../lib/api';
import {
  Sparkles,
  Scissors,
  Zap,
  Eye,
  Check,
  X,
  Play,
  Loader2,
  AlertCircle,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface AiEditPanelProps {
  jobId: string;
  videoDuration: number;
  aiPlan?: VideoEditPlan;
  onPlanReceived: (plan: VideoEditPlan) => void;
  onApplyAll: () => void;
  onSeek: (time: number) => void;
  onToggleCut: (id: string) => void;
  onToggleZoom: (id: string) => void;
  onToggleHighlight: (id: string) => void;
  onUseHookAsOpening?: (hookStart: number, hookEnd: number) => void;
}

export const AiEditPanel: React.FC<AiEditPanelProps> = ({
  jobId,
  aiPlan,
  onPlanReceived,
  onApplyAll,
  onSeek,
  onToggleCut,
  onToggleZoom,
  onToggleHighlight,
  onUseHookAsOpening,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAiAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await autoEditApi(jobId);
      if (res && res.plan) {
        onPlanReceived(res.plan);
      }
    } catch (err: any) {
      console.error('[AI Auto Edit Error]:', err);
      setError(err.message || 'Failed to analyze video with Gemini.');
    } finally {
      setLoading(false);
    }
  };

  const formatSeconds = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${String(sec).padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Top Banner / Trigger */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">✨ AI Auto Edit</h3>
              <p className="text-[10px] text-slate-400">Gemini Video &amp; Dialogue Intelligence</p>
            </div>
          </div>

          <button
            onClick={handleRunAiAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/30 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {aiPlan ? 'Re-Analyze' : 'Analyze Video'}
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-2 p-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* AI EDIT PLAN RESULTS */}
      {aiPlan && (
        <div className="space-y-4">
          {/* Summary Checklist */}
          <div className="p-3 rounded-xl bg-[#0e1526] border border-slate-800 space-y-1.5">
            <p className="text-[11px] font-bold text-slate-300">AI Edit Plan Ready:</p>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400">
              <div className="flex items-center gap-1 text-sky-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>{aiPlan.scenes?.length || 0} scenes identified</span>
              </div>
              <div className="flex items-center gap-1 text-rose-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>{aiPlan.suggestedCuts?.length || 0} suggested cuts</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>{aiPlan.highlights?.length || 0} key moments</span>
              </div>
              <div className="flex items-center gap-1 text-purple-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>{aiPlan.zooms?.length || 0} zoom opportunities</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500">Non-destructive suggestions</span>
              <button
                onClick={onApplyAll}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition-all"
              >
                Apply All
              </button>
            </div>
          </div>

          {/* Hook / Strong Opening */}
          {aiPlan.hook && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Flame className="w-4 h-4" />
                <span className="text-xs font-bold">Strong Hook Found ({Math.round(aiPlan.hook.score * 100)}% score)</span>
              </div>
              <p className="text-[11px] text-amber-200">
                {formatSeconds(aiPlan.hook.start)} → {formatSeconds(aiPlan.hook.end)}: {aiPlan.hook.reason}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onSeek(aiPlan.hook!.start)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-semibold"
                >
                  <Play className="w-2.5 h-2.5" /> Preview Hook
                </button>
                {onUseHookAsOpening && (
                  <button
                    onClick={() => onUseHookAsOpening(aiPlan.hook!.start, aiPlan.hook!.end)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold"
                  >
                    Use as Opening
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Suggested Cuts */}
          {aiPlan.suggestedCuts && aiPlan.suggestedCuts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
                <Scissors className="w-3.5 h-3.5" />
                <span>Suggested Cuts ({aiPlan.suggestedCuts.length})</span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {aiPlan.suggestedCuts.map((cut) => (
                  <div
                    key={cut.id}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                      cut.accepted
                        ? 'bg-rose-950/40 border-rose-600/60'
                        : 'bg-[#0d1220] border-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-mono text-[10px] text-slate-400">
                        {formatSeconds(cut.start)} → {formatSeconds(cut.end)}
                      </p>
                      <p className="text-[11px] text-slate-200 truncate">{cut.reason}</p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onSeek(cut.start)}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                        title="Seek & Preview"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onToggleCut(cut.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                          cut.accepted
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {cut.accepted ? 'Cut' : 'Ignore'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zoom Suggestions */}
          {aiPlan.zooms && aiPlan.zooms.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold">
                <Eye className="w-3.5 h-3.5" />
                <span>Zoom Opportunities ({aiPlan.zooms.length})</span>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {aiPlan.zooms.map((zoom) => (
                  <div
                    key={zoom.id}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                      zoom.accepted
                        ? 'bg-purple-950/40 border-purple-600/60'
                        : 'bg-[#0d1220] border-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-mono text-[10px] text-slate-400">
                        {formatSeconds(zoom.start)} → {formatSeconds(zoom.end)} ({zoom.scale}x)
                      </p>
                      <p className="text-[11px] text-slate-200 truncate">{zoom.reason || 'Visual emphasis'}</p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onSeek(zoom.start)}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                        title="Seek & Preview"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onToggleZoom(zoom.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                          zoom.accepted
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {zoom.accepted ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Highlights */}
          {aiPlan.highlights && aiPlan.highlights.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>Key Moments &amp; Highlights ({aiPlan.highlights.length})</span>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {aiPlan.highlights.map((h) => (
                  <div
                    key={h.id}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-colors ${
                      h.accepted
                        ? 'bg-amber-950/40 border-amber-600/60'
                        : 'bg-[#0d1220] border-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-mono text-[10px] text-slate-400">
                        {formatSeconds(h.start)} → {formatSeconds(h.end)} (Score: {Math.round(h.score * 100)}%)
                      </p>
                      <p className="text-[11px] text-slate-200 truncate">{h.reason}</p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onSeek(h.start)}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                        title="Seek & Preview"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onToggleHighlight(h.id)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                          h.accepted
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {h.accepted ? 'Kept' : 'Keep'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
