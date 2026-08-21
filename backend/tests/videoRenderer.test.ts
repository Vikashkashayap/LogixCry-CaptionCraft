import { calculateKeepIntervals } from '../src/services/ffmpeg/videoRenderer';

describe('calculateKeepIntervals', () => {
  it('should return whole duration when there are no accepted cuts or silences', () => {
    const intervals = calculateKeepIntervals(60.0, [], []);
    expect(intervals).toEqual([{ start: 0, end: 60.0 }]);
  });

  it('should calculate proper keep segments when cuts are accepted', () => {
    const cuts = [
      { id: '1', start: 10.0, end: 20.0, reason: 'unnecessary', accepted: true },
      { id: '2', start: 40.0, end: 45.0, reason: 'silence', accepted: true },
      { id: '3', start: 50.0, end: 55.0, reason: 'ignored', accepted: false }, // ignored
    ];

    const intervals = calculateKeepIntervals(60.0, cuts, []);
    expect(intervals).toEqual([
      { start: 0, end: 10.0 },
      { start: 20.0, end: 40.0 },
      { start: 45.0, end: 60.0 },
    ]);
  });

  it('should merge overlapping accepted cuts and silences properly', () => {
    const cuts = [{ id: '1', start: 5.0, end: 15.0, reason: 'cut', accepted: true }];
    const silences = [{ id: '2', start: 12.0, end: 20.0, duration: 8.0, accepted: true }];

    const intervals = calculateKeepIntervals(30.0, cuts, silences);
    expect(intervals).toEqual([
      { start: 0, end: 5.0 },
      { start: 20.0, end: 30.0 },
    ]);
  });
});
