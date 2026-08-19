import { captionsToSrt, captionsToAss, formatSrtTime, formatAssTime } from '../src/utils/subtitleFormatter';

describe('Subtitle Formatter Utility', () => {
  const sampleCaptions = [
    { start: 1.25, end: 3.50, text: 'Hello world' },
    { start: 4.00, end: 7.12, text: 'Testing AI captions' },
  ];

  it('should format SRT time correctly', () => {
    expect(formatSrtTime(1.25)).toBe('00:00:01,250');
    expect(formatSrtTime(65.5)).toBe('00:01:05,500');
  });

  it('should format ASS time correctly', () => {
    expect(formatAssTime(1.25)).toBe('0:00:01.25');
    expect(formatAssTime(65.5)).toBe('0:01:05.50');
  });

  it('should generate valid SRT string output', () => {
    const srt = captionsToSrt(sampleCaptions);
    expect(srt).toContain('1\n00:00:01,250 --> 00:00:03,500\nHello world');
    expect(srt).toContain('2\n00:00:04,000 --> 00:00:07,120\nTesting AI captions');
  });

  it('should generate valid ASS string output for classic style', () => {
    const ass = captionsToAss(sampleCaptions, 'classic');
    expect(ass).toContain('[Script Info]');
    expect(ass).toContain('Style: Classic,Arial,48');
    expect(ass).toContain('Dialogue: 0,0:00:01.25,0:00:03.50,Classic,,0,0,0,,Hello world');
  });

  it('should generate valid ASS string output for bold social style', () => {
    const ass = captionsToAss(sampleCaptions, 'bold');
    expect(ass).toContain('Style: BoldSocial,Arial Black,60');
    expect(ass).toContain('Dialogue: 0,0:00:01.25,0:00:03.50,BoldSocial,,0,0,0,,Hello world');
  });
});
