import { CaptionItem, CaptionStyle, ExtendedRenderOptions, CaptionPosition, AspectRatio } from '../types';

/**
 * Format seconds to SRT timestamp: HH:MM:SS,mmm
 */
export function formatSrtTime(seconds: number): string {
  const date = new Date(seconds * 1000);
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const mmm = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss},${mmm}`;
}

/**
 * Format seconds to ASS timestamp: H:MM:SS.cs (centiseconds)
 */
export function formatAssTime(seconds: number): string {
  const hh = Math.floor(seconds / 3600);
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const ss = String(Math.floor(seconds % 60)).padStart(2, '0');
  const cs = String(Math.floor((seconds % 1) * 100)).padStart(2, '0');
  return `${hh}:${mm}:${ss}.${cs}`;
}

/**
 * Convert captions array to SRT format string
 */
export function captionsToSrt(captions: CaptionItem[]): string {
  return captions
    .map((cap, idx) => {
      const index = idx + 1;
      const start = formatSrtTime(cap.start);
      const end = formatSrtTime(cap.end);
      return `${index}\n${start} --> ${end}\n${cap.text}\n`;
    })
    .join('\n');
}

// ─── Color Utilities ─────────────────────────────────────────────────────────

/**
 * Converts hex color (#RRGGBB) to ASS color (&HAABBGGRR).
 * Alpha (AA) is always 00 (fully opaque) unless specified.
 */
function hexToAss(hex: string, alpha: number = 0): string {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = hex.substring(0, 2);
  const g = hex.substring(2, 4);
  const b = hex.substring(4, 6);
  const aa = String(Math.round(alpha * 2.55)).padStart(2, '0').toUpperCase();
  return `&H${aa}${b}${g}${r}`;
}

/**
 * Maps editor position to ASS alignment number.
 * ASS numpad layout: 1=BL, 2=BC, 3=BR, 4=ML, 5=MC, 6=MR, 7=TL, 8=TC, 9=TR
 */
function positionToAssAlignment(position: CaptionPosition = 'bottom'): number {
  if (position === 'top') return 8;    // Top center
  if (position === 'center') return 5; // Middle center
  return 2;                            // Bottom center (default)
}

/**
 * Maps editor position to ASS margin values.
 */
function positionToMarginV(position: CaptionPosition = 'bottom'): number {
  if (position === 'top') return 50;
  if (position === 'center') return 0;
  return 55;
}

// ─── ASS Style Presets ────────────────────────────────────────────────────────

export const ASS_STYLES: Record<CaptionStyle, {
  name: string;
  fontName: string;
  fontSize: number;
  primaryColor: string;
  secondaryColor: string;
  outlineColor: string;
  backColor: string;
  bold: number;
  outline: number;
  shadow: number;
  alignment: number;
  marginV: number;
}> = {
  classic: {
    name: 'ClassicCinema',
    fontName: 'Arial',
    fontSize: 48,
    primaryColor: '&H00FFFFFF',
    secondaryColor: '&H00000000',
    outlineColor: '&H00000000',
    backColor: '&H90000000',
    bold: 1,
    outline: 3,
    shadow: 1.5,
    alignment: 2,
    marginV: 55,
  },
  bold: {
    name: 'BoldSocial',
    fontName: 'Arial Black',
    fontSize: 60,
    primaryColor: '&H0000E6FF',
    secondaryColor: '&H00000000',
    outlineColor: '&H00000000',
    backColor: '&H99000000',
    bold: 1,
    outline: 5,
    shadow: 2.5,
    alignment: 2,
    marginV: 75,
  },
  youtube: {
    name: 'YouTube',
    fontName: 'Arial',
    fontSize: 40,
    primaryColor: '&H00FFFFFF',
    secondaryColor: '&H00000000',
    outlineColor: '&H00000000',
    backColor: '&HB3000000', // ~70% black
    bold: 0,
    outline: 0,
    shadow: 0,
    alignment: 2,
    marginV: 45,
  },
  reels: {
    name: 'ReelsGreen',
    fontName: 'Impact',
    fontSize: 58,
    primaryColor: '&H0066FF00',
    secondaryColor: '&H00000000',
    outlineColor: '&H00000000',
    backColor: '&H90000000',
    bold: 1,
    outline: 4.5,
    shadow: 2,
    alignment: 5, // center
    marginV: 0,
  },
  minimal: {
    name: 'MinimalModern',
    fontName: 'Arial',
    fontSize: 38,
    primaryColor: '&H00F5F5F5',
    secondaryColor: '&H00000000',
    outlineColor: '&H001E1E1E',
    backColor: '&H70000000',
    bold: 0,
    outline: 2,
    shadow: 0,
    alignment: 2,
    marginV: 45,
  },
  karaoke: {
    name: 'Karaoke',
    fontName: 'Arial Black',
    fontSize: 52,
    primaryColor: '&H0000FFFF', // yellow (ASS BGR)
    secondaryColor: '&H00FFFFFF',
    outlineColor: '&H00000000',
    backColor: '&HCC1A1A1A',
    bold: 1,
    outline: 3,
    shadow: 0,
    alignment: 5, // center
    marginV: 0,
  },
  highlight: {
    name: 'NeonCyan',
    fontName: 'Impact',
    fontSize: 56,
    primaryColor: '&H00FFFF00',
    secondaryColor: '&H00000000',
    outlineColor: '&H00000000',
    backColor: '&H90000000',
    bold: 1,
    outline: 4,
    shadow: 2,
    alignment: 2,
    marginV: 65,
  },
  cyber: {
    name: 'CyberPink',
    fontName: 'Arial Black',
    fontSize: 54,
    primaryColor: '&H00D000FF',
    secondaryColor: '&H00000000',
    outlineColor: '&H00000000',
    backColor: '&HA0000000',
    bold: 1,
    outline: 4.5,
    shadow: 2.5,
    alignment: 2,
    marginV: 70,
  },
};

import { ASPECT_RATIO_DIMS } from '../services/ffmpegService';

// ─── Static ASS Generation ───────────────────────────────────────────────────

/**
 * Convert captions array to ASS format string with preset style and aspect ratio resolution.
 */
export function captionsToAss(
  captions: CaptionItem[],
  styleKey: CaptionStyle = 'classic',
  aspectRatio: AspectRatio = '16:9'
): string {
  const style = ASS_STYLES[styleKey] || ASS_STYLES.classic;
  return buildAssDocument(captions, style, aspectRatio);
}

// ─── Dynamic ASS Generation (editor custom options) ──────────────────────────

/**
 * Convert captions to ASS using full EditorState-style custom options and target aspect ratio.
 */
export function captionsToAssCustom(
  captions: CaptionItem[],
  opts: ExtendedRenderOptions,
  styleKey: CaptionStyle = 'classic',
  aspectRatio?: AspectRatio
): string {
  const preset = ASS_STYLES[styleKey] || ASS_STYLES.classic;
  const position: CaptionPosition = opts.position || 'bottom';
  const targetRatio: AspectRatio = opts.aspectRatio || aspectRatio || '16:9';

  // Resolve primary color
  const primaryColor = opts.textColor
    ? hexToAss(opts.textColor, 0)
    : preset.primaryColor;

  // Resolve outline
  const outlineEnabled = opts.outlineEnabled !== false;
  const outlineColor = outlineEnabled && opts.outlineColor
    ? hexToAss(opts.outlineColor, 0)
    : (outlineEnabled ? preset.outlineColor : '&H00000000');
  const outlineWidth = outlineEnabled
    ? (opts.outlineWidth ?? preset.outline)
    : 0;

  // Resolve background box
  const bgEnabled = opts.backgroundEnabled === true;
  let backColor = '&H00000000'; // transparent
  let borderStyle = 1; // outline + shadow
  if (bgEnabled) {
    const bgAlpha = Math.round((1 - (opts.backgroundOpacity ?? 60) / 100) * 255);
    backColor = hexToAss(opts.backgroundColor || '#000000', bgAlpha);
    borderStyle = 3; // opaque box
  }

  // Resolve font
  const fontName = opts.fontFamily || preset.fontName;
  const fontSize = opts.fontSize || preset.fontSize;
  const alignment = positionToAssAlignment(position);
  const marginV = positionToMarginV(position);

  const dynamicStyle = {
    name: 'CustomEditor',
    fontName,
    fontSize,
    primaryColor,
    secondaryColor: '&H00000000',
    outlineColor,
    backColor,
    bold: 1,
    outline: outlineWidth,
    shadow: 0,
    alignment,
    marginV,
    borderStyle,
  };

  return buildAssDocument(captions, dynamicStyle, targetRatio);
}

// ─── Internal ASS Builder ─────────────────────────────────────────────────────

interface AssStyleDef {
  name: string;
  fontName: string;
  fontSize: number;
  primaryColor: string;
  secondaryColor: string;
  outlineColor: string;
  backColor: string;
  bold: number;
  outline: number;
  shadow: number;
  alignment: number;
  marginV: number;
  borderStyle?: number;
}

function buildAssDocument(
  captions: CaptionItem[],
  style: AssStyleDef,
  aspectRatio: AspectRatio = '16:9'
): string {
  const borderStyle = style.borderStyle ?? 1;
  const dims = ASPECT_RATIO_DIMS[aspectRatio] || ASPECT_RATIO_DIMS['16:9'];
  const resX = dims.width;
  const resY = dims.height;

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${resX}
PlayResY: ${resY}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ${style.name},${style.fontName},${style.fontSize},${style.primaryColor},${style.secondaryColor},${style.outlineColor},${style.backColor},${style.bold},0,0,0,100,100,0,0,${borderStyle},${style.outline},${style.shadow},${style.alignment},20,20,${style.marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = captions
    .map((cap) => {
      const start = formatAssTime(cap.start);
      const end = formatAssTime(cap.end);
      // Safe text: strip ASS override tags braces and normalize newlines
      const text = cap.text
        .replace(/\r\n|\r/g, '\n')
        .replace(/\n/g, '\\N')
        .replace(/[{}]/g, '');
      return `Dialogue: 0,${start},${end},${style.name},,0,0,0,,${text}`;
    })
    .join('\n');

  return header + events;
}
