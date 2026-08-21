import { validateEditPlan } from '../src/utils/editPlanValidator';

describe('validateEditPlan', () => {
  it('should validate a correct plan without modifications', () => {
    const raw = {
      duration: 120.4,
      scenes: [{ start: 0, end: 12.5, description: 'Introduction' }],
      suggestedCuts: [{ start: 3.2, end: 6.1, reason: 'Unnecessary introduction' }],
      highlights: [{ start: 24.2, end: 34.8, score: 0.94, reason: 'Important explanation' }],
      zooms: [{ start: 25.1, end: 28.2, scale: 1.1, reason: 'Important statement' }],
      transitions: [{ type: 'crossfade', time: 12.5, duration: 0.3, reason: 'Scene change' }],
      hook: { start: 7.2, end: 15.4, score: 0.91, reason: 'Strong opening statement' },
      recommendations: ['Remove long pauses'],
    };

    const result = validateEditPlan(raw, 120.4);
    expect(result.valid).toBe(true);
    expect(result.plan.scenes.length).toBe(1);
    expect(result.plan.suggestedCuts.length).toBe(1);
    expect(result.plan.highlights.length).toBe(1);
    expect(result.plan.zooms.length).toBe(1);
    expect(result.plan.hook).toBeDefined();
    expect(result.plan.zooms[0].scale).toBe(1.1);
  });

  it('should repair invalid timestamps and out-of-bounds zoom scale', () => {
    const raw = {
      duration: 50.0,
      suggestedCuts: [{ start: -5, end: 60, reason: '' }], // out of bounds
      zooms: [{ start: 10, end: 12, scale: 2.5 }], // scale > 1.25 safe limit
      highlights: [{ start: 15, end: 20, score: 1.8 }], // score > 1.0
    };

    const result = validateEditPlan(raw, 50.0);
    expect(result.valid).toBe(true);
    expect(result.repaired).toBe(true);
    expect(result.plan.suggestedCuts[0].start).toBe(0);
    expect(result.plan.suggestedCuts[0].end).toBe(50.0);
    expect(result.plan.zooms[0].scale).toBe(1.25); // clamped to safe max
    expect(result.plan.highlights[0].score).toBe(1.0); // clamped to 1.0
  });

  it('should handle completely empty or corrupted input gracefully', () => {
    const result = validateEditPlan(null, 30.0);
    expect(result.valid).toBe(true);
    expect(result.plan.duration).toBe(30.0);
    expect(result.plan.scenes).toEqual([]);
    expect(result.plan.suggestedCuts).toEqual([]);
    expect(result.plan.recommendations.length).toBeGreaterThan(0);
  });
});
