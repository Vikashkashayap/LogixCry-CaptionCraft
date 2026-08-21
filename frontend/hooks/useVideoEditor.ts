'use client';

import { useCallback, useEffect, useReducer } from 'react';
import {
  Caption,
  EditorState,
  DEFAULT_EDITOR_STATE,
  CaptionStyleKey,
  AspectRatioKey,
  PositionKey,
  CutSegment,
  SilenceSegment,
  HighlightSegment,
  ZoomEffect,
  TransitionEffect,
  MusicConfig,
  SpeedSegment,
  VideoEditPlan,
} from '../types/editor';
import { generateCaptionId } from '../lib/captionUtils';
import { STYLE_MAP } from '../lib/editorStyles';

// ─── Action Types ─────────────────────────────────────────────────────────────

type Action =
  // Captions
  | { type: 'SET_CAPTIONS'; captions: Caption[] }
  | { type: 'UPDATE_CAPTION'; id: string; updates: Partial<Omit<Caption, 'id'>> }
  | { type: 'ADD_CAPTION'; caption: Caption }
  | { type: 'DELETE_CAPTION'; id: string }
  // Styles
  | { type: 'SET_STYLE'; style: CaptionStyleKey }
  | { type: 'SET_FONT_FAMILY'; fontFamily: string }
  | { type: 'SET_FONT_SIZE'; fontSize: number }
  | { type: 'SET_TEXT_COLOR'; textColor: string }
  | { type: 'SET_BACKGROUND_ENABLED'; enabled: boolean }
  | { type: 'SET_BACKGROUND_COLOR'; backgroundColor: string }
  | { type: 'SET_BACKGROUND_OPACITY'; backgroundOpacity: number }
  | { type: 'SET_OUTLINE_ENABLED'; enabled: boolean }
  | { type: 'SET_OUTLINE_COLOR'; outlineColor: string }
  | { type: 'SET_OUTLINE_WIDTH'; outlineWidth: number }
  | { type: 'SET_POSITION'; position: PositionKey }
  | { type: 'SET_CAPTION_WIDTH'; captionWidth: number }
  | { type: 'SET_TEXT_ALIGN'; textAlign: 'left' | 'center' | 'right' }
  | { type: 'SET_ASPECT_RATIO'; aspectRatio: AspectRatioKey }
  | { type: 'RESET_STYLE' }
  // Cuts
  | { type: 'SET_CUTS'; cuts: CutSegment[] }
  | { type: 'ADD_CUT'; cut: CutSegment }
  | { type: 'UPDATE_CUT'; id: string; updates: Partial<CutSegment> }
  | { type: 'DELETE_CUT'; id: string }
  | { type: 'TOGGLE_CUT_ACCEPTED'; id: string }
  // Silence
  | { type: 'SET_SILENCE_SEGMENTS'; segments: SilenceSegment[] }
  | { type: 'TOGGLE_SILENCE_ACCEPTED'; id: string }
  | { type: 'ACCEPT_ALL_SILENCE' }
  // Highlights
  | { type: 'SET_HIGHLIGHTS'; highlights: HighlightSegment[] }
  | { type: 'TOGGLE_HIGHLIGHT_ACCEPTED'; id: string }
  // Zooms
  | { type: 'SET_ZOOMS'; zooms: ZoomEffect[] }
  | { type: 'ADD_ZOOM'; zoom: ZoomEffect }
  | { type: 'UPDATE_ZOOM'; id: string; updates: Partial<ZoomEffect> }
  | { type: 'DELETE_ZOOM'; id: string }
  | { type: 'TOGGLE_ZOOM_ACCEPTED'; id: string }
  // Transitions
  | { type: 'SET_TRANSITIONS'; transitions: TransitionEffect[] }
  | { type: 'ADD_TRANSITION'; transition: TransitionEffect }
  | { type: 'DELETE_TRANSITION'; id: string }
  // Music & Audio
  | { type: 'SET_MUSIC'; music?: MusicConfig }
  | { type: 'UPDATE_MUSIC'; updates: Partial<MusicConfig> }
  // Speed
  | { type: 'SET_GLOBAL_SPEED'; speed: number }
  | { type: 'SET_SPEED_SEGMENTS'; segments: SpeedSegment[] }
  // AI Analysis
  | { type: 'SET_AI_ANALYSIS'; plan: VideoEditPlan }
  | { type: 'APPLY_ALL_AI_SUGGESTIONS' };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function editorReducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'SET_CAPTIONS':
      return { ...state, captions: action.captions };

    case 'UPDATE_CAPTION':
      return {
        ...state,
        captions: state.captions.map((c) =>
          c.id === action.id ? { ...c, ...action.updates } : c
        ),
      };

    case 'ADD_CAPTION':
      return { ...state, captions: [...state.captions, action.caption] };

    case 'DELETE_CAPTION':
      return { ...state, captions: state.captions.filter((c) => c.id !== action.id) };

    case 'SET_STYLE': {
      const styleDefaults = STYLE_MAP[action.style]?.defaults;
      if (!styleDefaults) return { ...state, style: action.style };
      return {
        ...state,
        style: action.style,
        fontFamily: styleDefaults.fontFamily,
        fontSize: styleDefaults.fontSize,
        textColor: styleDefaults.textColor,
        backgroundEnabled: styleDefaults.backgroundEnabled,
        backgroundColor: styleDefaults.backgroundColor,
        backgroundOpacity: styleDefaults.backgroundOpacity,
        outlineEnabled: styleDefaults.outlineEnabled,
        outlineColor: styleDefaults.outlineColor,
        outlineWidth: styleDefaults.outlineWidth,
        position: styleDefaults.position,
        textAlign: styleDefaults.textAlign,
      };
    }

    case 'SET_FONT_FAMILY':
      return { ...state, fontFamily: action.fontFamily };
    case 'SET_FONT_SIZE':
      return { ...state, fontSize: Math.max(12, Math.min(96, action.fontSize)) };
    case 'SET_TEXT_COLOR':
      return { ...state, textColor: action.textColor };
    case 'SET_BACKGROUND_ENABLED':
      return { ...state, backgroundEnabled: action.enabled };
    case 'SET_BACKGROUND_COLOR':
      return { ...state, backgroundColor: action.backgroundColor };
    case 'SET_BACKGROUND_OPACITY':
      return { ...state, backgroundOpacity: Math.max(0, Math.min(100, action.backgroundOpacity)) };
    case 'SET_OUTLINE_ENABLED':
      return { ...state, outlineEnabled: action.enabled };
    case 'SET_OUTLINE_COLOR':
      return { ...state, outlineColor: action.outlineColor };
    case 'SET_OUTLINE_WIDTH':
      return { ...state, outlineWidth: Math.max(0, Math.min(10, action.outlineWidth)) };
    case 'SET_POSITION':
      return { ...state, position: action.position };
    case 'SET_CAPTION_WIDTH':
      return { ...state, captionWidth: Math.max(20, Math.min(100, action.captionWidth)) };
    case 'SET_TEXT_ALIGN':
      return { ...state, textAlign: action.textAlign };
    case 'SET_ASPECT_RATIO':
      return { ...state, aspectRatio: action.aspectRatio };

    case 'RESET_STYLE':
      return {
        ...state,
        ...DEFAULT_EDITOR_STATE,
        captions: state.captions,
        aspectRatio: state.aspectRatio,
        cuts: state.cuts,
        silenceSegments: state.silenceSegments,
        highlights: state.highlights,
        zooms: state.zooms,
        transitions: state.transitions,
        music: state.music,
        globalSpeed: state.globalSpeed,
      };

    // Cuts
    case 'SET_CUTS':
      return { ...state, cuts: action.cuts };
    case 'ADD_CUT':
      return { ...state, cuts: [...state.cuts, action.cut] };
    case 'UPDATE_CUT':
      return {
        ...state,
        cuts: state.cuts.map((c) => (c.id === action.id ? { ...c, ...action.updates } : c)),
      };
    case 'DELETE_CUT':
      return { ...state, cuts: state.cuts.filter((c) => c.id !== action.id) };
    case 'TOGGLE_CUT_ACCEPTED':
      return {
        ...state,
        cuts: state.cuts.map((c) => (c.id === action.id ? { ...c, accepted: !c.accepted } : c)),
      };

    // Silence
    case 'SET_SILENCE_SEGMENTS':
      return { ...state, silenceSegments: action.segments };
    case 'TOGGLE_SILENCE_ACCEPTED':
      return {
        ...state,
        silenceSegments: state.silenceSegments.map((s) =>
          s.id === action.id ? { ...s, accepted: !s.accepted } : s
        ),
      };
    case 'ACCEPT_ALL_SILENCE':
      return {
        ...state,
        silenceSegments: state.silenceSegments.map((s) => ({ ...s, accepted: true })),
      };

    // Highlights
    case 'SET_HIGHLIGHTS':
      return { ...state, highlights: action.highlights };
    case 'TOGGLE_HIGHLIGHT_ACCEPTED':
      return {
        ...state,
        highlights: state.highlights.map((h) =>
          h.id === action.id ? { ...h, accepted: !h.accepted } : h
        ),
      };

    // Zooms
    case 'SET_ZOOMS':
      return { ...state, zooms: action.zooms };
    case 'ADD_ZOOM':
      return { ...state, zooms: [...state.zooms, action.zoom] };
    case 'UPDATE_ZOOM':
      return {
        ...state,
        zooms: state.zooms.map((z) => (z.id === action.id ? { ...z, ...action.updates } : z)),
      };
    case 'DELETE_ZOOM':
      return { ...state, zooms: state.zooms.filter((z) => z.id !== action.id) };
    case 'TOGGLE_ZOOM_ACCEPTED':
      return {
        ...state,
        zooms: state.zooms.map((z) => (z.id === action.id ? { ...z, accepted: !z.accepted } : z)),
      };

    // Transitions
    case 'SET_TRANSITIONS':
      return { ...state, transitions: action.transitions };
    case 'ADD_TRANSITION':
      return { ...state, transitions: [...state.transitions, action.transition] };
    case 'DELETE_TRANSITION':
      return { ...state, transitions: state.transitions.filter((t) => t.id !== action.id) };

    // Music
    case 'SET_MUSIC':
      return { ...state, music: action.music };
    case 'UPDATE_MUSIC':
      return {
        ...state,
        music: state.music ? { ...state.music, ...action.updates } : (action.updates as MusicConfig),
      };

    // Speed
    case 'SET_GLOBAL_SPEED':
      return { ...state, globalSpeed: action.speed };
    case 'SET_SPEED_SEGMENTS':
      return { ...state, speedSegments: action.segments };

    // AI Analysis
    case 'SET_AI_ANALYSIS':
      return {
        ...state,
        aiAnalysis: action.plan,
        cuts: action.plan.suggestedCuts || [],
        highlights: action.plan.highlights || [],
        zooms: action.plan.zooms || [],
        transitions: action.plan.transitions || [],
      };

    case 'APPLY_ALL_AI_SUGGESTIONS':
      return {
        ...state,
        cuts: state.cuts.map((c) => ({ ...c, accepted: true })),
        silenceSegments: state.silenceSegments.map((s) => ({ ...s, accepted: true })),
        highlights: state.highlights.map((h) => ({ ...h, accepted: true })),
        zooms: state.zooms.map((z) => ({ ...z, accepted: true })),
        transitions: state.transitions.map((t) => ({ ...t, accepted: true })),
      };

    default:
      return state;
  }
}

// ─── Undo/Redo Stack ──────────────────────────────────────────────────────────

const MAX_HISTORY = 50;

interface HistoryStack {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
}

function createInitialHistory(present: EditorState): HistoryStack {
  return { past: [], present, future: [] };
}

function historyReducer(
  history: HistoryStack,
  action: Action | { type: 'UNDO' } | { type: 'REDO' }
): HistoryStack {
  if (action.type === 'UNDO') {
    if (history.past.length === 0) return history;
    const previous = history.past[history.past.length - 1];
    return {
      past: history.past.slice(0, -1),
      present: previous,
      future: [history.present, ...history.future],
    };
  }

  if (action.type === 'REDO') {
    if (history.future.length === 0) return history;
    const next = history.future[0];
    return {
      past: [...history.past, history.present].slice(-MAX_HISTORY),
      present: next,
      future: history.future.slice(1),
    };
  }

  const newPresent = editorReducer(history.present, action as Action);
  if (newPresent === history.present) return history;

  return {
    past: [...history.past, history.present].slice(-MAX_HISTORY),
    present: newPresent,
    future: [],
  };
}

// ─── Hook Return Type ─────────────────────────────────────────────────────────

export interface UseVideoEditorReturn {
  state: EditorState;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  // Caption actions
  setCaptions: (captions: Caption[]) => void;
  updateCaption: (id: string, updates: Partial<Omit<Caption, 'id'>>) => void;
  addCaption: (atTime?: number) => Caption;
  deleteCaption: (id: string) => void;
  // Style actions
  setStyle: (style: CaptionStyleKey) => void;
  setFontFamily: (fontFamily: string) => void;
  setFontSize: (fontSize: number) => void;
  setTextColor: (color: string) => void;
  setBackgroundEnabled: (enabled: boolean) => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setOutlineEnabled: (enabled: boolean) => void;
  setOutlineColor: (color: string) => void;
  setOutlineWidth: (width: number) => void;
  setPosition: (position: PositionKey) => void;
  setCaptionWidth: (width: number) => void;
  setTextAlign: (align: 'left' | 'center' | 'right') => void;
  setAspectRatio: (ratio: AspectRatioKey) => void;
  resetStyle: () => void;
  // Phase 2: Cuts
  setCuts: (cuts: CutSegment[]) => void;
  addCut: (start: number, end: number, reason?: string) => void;
  updateCut: (id: string, updates: Partial<CutSegment>) => void;
  deleteCut: (id: string) => void;
  toggleCutAccepted: (id: string) => void;
  // Silence
  setSilenceSegments: (segments: SilenceSegment[]) => void;
  toggleSilenceAccepted: (id: string) => void;
  acceptAllSilence: () => void;
  // Highlights
  setHighlights: (highlights: HighlightSegment[]) => void;
  toggleHighlightAccepted: (id: string) => void;
  // Zooms
  setZooms: (zooms: ZoomEffect[]) => void;
  addZoom: (start: number, end: number, scale?: number, reason?: string) => void;
  updateZoom: (id: string, updates: Partial<ZoomEffect>) => void;
  deleteZoom: (id: string) => void;
  toggleZoomAccepted: (id: string) => void;
  // Transitions
  setTransitions: (transitions: TransitionEffect[]) => void;
  addTransition: (time: number, type?: 'cut' | 'fade' | 'crossfade', duration?: number) => void;
  deleteTransition: (id: string) => void;
  // Music
  setMusic: (music?: MusicConfig) => void;
  updateMusic: (updates: Partial<MusicConfig>) => void;
  // Speed
  setGlobalSpeed: (speed: number) => void;
  // AI
  setAiAnalysis: (plan: VideoEditPlan) => void;
  applyAllAiSuggestions: () => void;
}

export function useVideoEditor(
  initialCaptions: Caption[],
  initialStyle?: CaptionStyleKey,
  initialAspectRatio?: AspectRatioKey
): UseVideoEditorReturn {
  const initialState: EditorState = {
    captions: initialCaptions,
    ...DEFAULT_EDITOR_STATE,
    style: initialStyle || DEFAULT_EDITOR_STATE.style,
    aspectRatio: initialAspectRatio || DEFAULT_EDITOR_STATE.aspectRatio,
  };

  const styleDefaults = STYLE_MAP[initialState.style]?.defaults;
  if (styleDefaults) {
    Object.assign(initialState, styleDefaults);
    initialState.captions = initialCaptions;
    initialState.aspectRatio = initialAspectRatio || DEFAULT_EDITOR_STATE.aspectRatio;
  }

  const [history, dispatch] = useReducer(historyReducer, createInitialHistory(initialState));
  const state = history.present;

  // Keyboard shortcuts (Undo: Ctrl/Cmd + Z, Redo: Ctrl/Cmd + Shift + Z or Ctrl + Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      if (!modKey) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addCaption = useCallback((atTime?: number): Caption => {
    const start = atTime ?? 0;
    const end = start + 2;
    const caption: Caption = {
      id: generateCaptionId(),
      start,
      end,
      text: '',
    };
    dispatch({ type: 'ADD_CAPTION', caption });
    return caption;
  }, []);

  const addCut = useCallback((start: number, end: number, reason = 'Manual Cut') => {
    dispatch({
      type: 'ADD_CUT',
      cut: {
        id: generateCaptionId(),
        start,
        end,
        reason,
        accepted: true,
      },
    });
  }, []);

  const addZoom = useCallback((start: number, end: number, scale = 1.1, reason = 'Emphasis zoom') => {
    dispatch({
      type: 'ADD_ZOOM',
      zoom: {
        id: generateCaptionId(),
        start,
        end,
        scale,
        reason,
        accepted: true,
      },
    });
  }, []);

  const addTransition = useCallback((time: number, type: 'cut' | 'fade' | 'crossfade' = 'crossfade', duration = 0.3) => {
    dispatch({
      type: 'ADD_TRANSITION',
      transition: {
        id: generateCaptionId(),
        type,
        time,
        duration,
        accepted: true,
      },
    });
  }, []);

  return {
    state,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo: () => dispatch({ type: 'UNDO' }),
    redo: () => dispatch({ type: 'REDO' }),

    setCaptions: (captions) => dispatch({ type: 'SET_CAPTIONS', captions }),
    updateCaption: (id, updates) => dispatch({ type: 'UPDATE_CAPTION', id, updates }),
    addCaption,
    deleteCaption: (id) => dispatch({ type: 'DELETE_CAPTION', id }),

    setStyle: (style) => dispatch({ type: 'SET_STYLE', style }),
    setFontFamily: (fontFamily) => dispatch({ type: 'SET_FONT_FAMILY', fontFamily }),
    setFontSize: (fontSize) => dispatch({ type: 'SET_FONT_SIZE', fontSize }),
    setTextColor: (textColor) => dispatch({ type: 'SET_TEXT_COLOR', textColor }),
    setBackgroundEnabled: (enabled) => dispatch({ type: 'SET_BACKGROUND_ENABLED', enabled }),
    setBackgroundColor: (backgroundColor) => dispatch({ type: 'SET_BACKGROUND_COLOR', backgroundColor }),
    setBackgroundOpacity: (backgroundOpacity) => dispatch({ type: 'SET_BACKGROUND_OPACITY', backgroundOpacity }),
    setOutlineEnabled: (enabled) => dispatch({ type: 'SET_OUTLINE_ENABLED', enabled }),
    setOutlineColor: (outlineColor) => dispatch({ type: 'SET_OUTLINE_COLOR', outlineColor }),
    setOutlineWidth: (outlineWidth) => dispatch({ type: 'SET_OUTLINE_WIDTH', outlineWidth }),
    setPosition: (position) => dispatch({ type: 'SET_POSITION', position }),
    setCaptionWidth: (captionWidth) => dispatch({ type: 'SET_CAPTION_WIDTH', captionWidth }),
    setTextAlign: (textAlign) => dispatch({ type: 'SET_TEXT_ALIGN', textAlign }),
    setAspectRatio: (aspectRatio) => dispatch({ type: 'SET_ASPECT_RATIO', aspectRatio }),
    resetStyle: () => dispatch({ type: 'RESET_STYLE' }),

    // Cuts
    setCuts: (cuts) => dispatch({ type: 'SET_CUTS', cuts }),
    addCut,
    updateCut: (id, updates) => dispatch({ type: 'UPDATE_CUT', id, updates }),
    deleteCut: (id) => dispatch({ type: 'DELETE_CUT', id }),
    toggleCutAccepted: (id) => dispatch({ type: 'TOGGLE_CUT_ACCEPTED', id }),

    // Silence
    setSilenceSegments: (segments) => dispatch({ type: 'SET_SILENCE_SEGMENTS', segments }),
    toggleSilenceAccepted: (id) => dispatch({ type: 'TOGGLE_SILENCE_ACCEPTED', id }),
    acceptAllSilence: () => dispatch({ type: 'ACCEPT_ALL_SILENCE' }),

    // Highlights
    setHighlights: (highlights) => dispatch({ type: 'SET_HIGHLIGHTS', highlights }),
    toggleHighlightAccepted: (id) => dispatch({ type: 'TOGGLE_HIGHLIGHT_ACCEPTED', id }),

    // Zooms
    setZooms: (zooms) => dispatch({ type: 'SET_ZOOMS', zooms }),
    addZoom,
    updateZoom: (id, updates) => dispatch({ type: 'UPDATE_ZOOM', id, updates }),
    deleteZoom: (id) => dispatch({ type: 'DELETE_ZOOM', id }),
    toggleZoomAccepted: (id) => dispatch({ type: 'TOGGLE_ZOOM_ACCEPTED', id }),

    // Transitions
    setTransitions: (transitions) => dispatch({ type: 'SET_TRANSITIONS', transitions }),
    addTransition,
    deleteTransition: (id) => dispatch({ type: 'DELETE_TRANSITION', id }),

    // Music
    setMusic: (music) => dispatch({ type: 'SET_MUSIC', music }),
    updateMusic: (updates) => dispatch({ type: 'UPDATE_MUSIC', updates }),

    // Speed
    setGlobalSpeed: (speed) => dispatch({ type: 'SET_GLOBAL_SPEED', speed }),

    // AI
    setAiAnalysis: (plan) => dispatch({ type: 'SET_AI_ANALYSIS', plan }),
    applyAllAiSuggestions: () => dispatch({ type: 'APPLY_ALL_AI_SUGGESTIONS' }),
  };
}
