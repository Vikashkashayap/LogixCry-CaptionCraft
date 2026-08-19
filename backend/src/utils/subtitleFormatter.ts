import { CaptionItem, CaptionStyle } from '../types';

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

/**
 * Style configurations for Advanced SubStation Alpha (ASS)
 * Note: ASS colors are in hexadecimal &HAABBGGRR format.
 */
export const ASS_STYLES: Record<CaptionStyle, {
  name: string;
  fontName: string;
  fontSize: number;
  primaryColor: string; // &HAABBGGRR
  secondaryColor: string;
  outlineColor: string;
  backColor: string;
  bold: number;
  outline: number;
  shadow: number;
  alignment: number; // 2 = bottom center, 5 = center
  marginV: number;
}> = {
  classic: {
    name: 'ClassicCinema',
    fontName: 'Arial',
    fontSize: 48,
    primaryColor: '&H00FFFFFF', // Pure White
    secondaryColor: '&H00000000',
    outlineColor: '&H00000000', // Black outline
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
    primaryColor: '&H0000E6FF', // Vibrant Viral Yellow (B:00, G:E6, R:FF)
    secondaryColor: '&H00000000',
    outlineColor: '&H00000000', // Heavy Black Stroke
    backColor: '&H99000000',
    bold: 1,
    outline: 5,
    shadow: 2.5,
    alignment: 2,
    marginV: 75,
  },
  minimal: {
    name: 'MinimalModern',
    fontName: 'Arial',
    fontSize: 38,
    primaryColor: '&H00F5F5F5', // Soft White
    secondaryColor: '&H00000000',
    outlineColor: '&H001E1E1E', // Dark subtle edge
    backColor: '&H70000000',
    bold: 0,
    outline: 2,
    shadow: 0,
    alignment: 2,
    marginV: 45,
  },
  highlight: {
    name: 'NeonCyan',
    fontName: 'Impact',
    fontSize: 56,
    primaryColor: '&H00FFFF00', // Bright Cyan (B:FF, G:FF, R:00)
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
    primaryColor: '&H00D000FF', // Hot Neon Magenta/Pink (B:D0, G:00, R:FF)
    secondaryColor: '&H00000000',
    outlineColor: '&H00000000',
    backColor: '&HA0000000',
    bold: 1,
    outline: 4.5,
    shadow: 2.5,
    alignment: 2,
    marginV: 70,
  },
  reels: {
    name: 'ReelsGreen',
    fontName: 'Impact',
    fontSize: 58,
    primaryColor: '&H0000FF66', // Vibrant Spring Green
    secondaryColor: '&H00000000',
    outlineColor: '&H00000000',
    backColor: '&H90000000',
    bold: 1,
    outline: 4.5,
    shadow: 2,
    alignment: 2,
    marginV: 70,
  },
};

/**
 * Convert captions array to ASS format string with customized style
 */
export function captionsToAss(captions: CaptionItem[], styleKey: CaptionStyle = 'classic'): string {
  const style = ASS_STYLES[styleKey] || ASS_STYLES.classic;

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ${style.name},${style.fontName},${style.fontSize},${style.primaryColor},${style.secondaryColor},${style.outlineColor},${style.backColor},${style.bold},0,0,0,100,100,0,0,1,${style.outline},${style.shadow},${style.alignment},20,20,${style.marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = captions
    .map((cap) => {
      const start = formatAssTime(cap.start);
      const end = formatAssTime(cap.end);
      // Clean up special characters for ASS
      const text = cap.text.replace(/\n/g, '\\N').replace(/[{}]/g, '');
      return `Dialogue: 0,${start},${end},${style.name},,0,0,0,,${text}`;
    })
    .join('\n');

  return header + events;
}
