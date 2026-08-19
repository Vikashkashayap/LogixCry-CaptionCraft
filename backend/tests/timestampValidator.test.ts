import { validateAndSanitizeCaptions, TimestampValidationError } from '../src/utils/timestampValidator';

describe('Timestamp Validator Utility', () => {
  it('should validate and sanitize clean Gemini output', () => {
    const rawInput = {
      language: 'English',
      duration: 15.0,
      captions: [
        { start: 0.5, end: 3.2, text: 'Hello everyone' },
        { start: 3.2, end: 6.0, text: 'Welcome to this video' },
      ],
    };

    const result = validateAndSanitizeCaptions(rawInput);
    expect(result.language).toBe('English');
    expect(result.duration).toBe(15.0);
    expect(result.captions.length).toBe(2);
    expect(result.captions[0].text).toBe('Hello everyone');
    expect(result.captions[1].start).toBe(3.2);
  });

  it('should fix overlapping timestamps gracefully', () => {
    const rawInput = {
      language: 'Hindi',
      duration: 10.0,
      captions: [
        { start: 0.0, end: 4.0, text: 'First line' },
        { start: 3.5, end: 7.0, text: 'Overlapping second line' },
      ],
    };

    const result = validateAndSanitizeCaptions(rawInput);
    expect(result.captions[0].end).toBeLessThanOrEqual(result.captions[1].start);
  });

  it('should auto-repair invalid end times where start >= end', () => {
    const rawInput = {
      language: 'English',
      duration: 12.0,
      captions: [
        { start: 2.0, end: 1.5, text: 'Invalid end time segment' },
      ],
    };

    const result = validateAndSanitizeCaptions(rawInput);
    expect(result.captions[0].end).toBeGreaterThan(result.captions[0].start);
  });

  it('should handle empty captions array gracefully without error', () => {
    const result = validateAndSanitizeCaptions({ language: 'English', duration: 10, captions: [] });
    expect(result.captions).toEqual([]);
    expect(result.language).toBe('English');
  });

  it('should throw TimestampValidationError if input is not an object', () => {
    expect(() => {
      validateAndSanitizeCaptions(null);
    }).toThrow(TimestampValidationError);
  });
});
