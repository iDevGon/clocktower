import { describe, expect, it } from 'vitest';
import { mergeDurationParts, splitDurationSeconds } from '../durationInput';

describe('splitDurationSeconds', () => {
  it('splits a total into editable minute and second parts', () => {
    expect(splitDurationSeconds(125)).toEqual({ minutes: '2', seconds: '5' });
  });

  it('preserves unlimited as zero minute and second parts', () => {
    expect(splitDurationSeconds(0)).toEqual({ minutes: '0', seconds: '0' });
  });

  it('floors finite nonnegative totals before splitting', () => {
    expect(splitDurationSeconds(125.9)).toEqual({
      minutes: '2',
      seconds: '5',
    });
  });

  it.each([
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])('normalizes invalid totals of %s to unlimited', (value) => {
    expect(splitDurationSeconds(value)).toEqual({
      minutes: '0',
      seconds: '0',
    });
  });

  it('accepts finite totals beyond the safe integer range', () => {
    expect(splitDurationSeconds(Number.MAX_SAFE_INTEGER + 1)).toEqual({
      minutes: '150119987579016',
      seconds: '32',
    });
  });
});

describe('mergeDurationParts', () => {
  it('merges minutes and unnormalized seconds into total seconds', () => {
    const total = mergeDurationParts('2', '75');

    expect(total).toBe(195);
    expect(splitDurationSeconds(total ?? -1)).toEqual({
      minutes: '3',
      seconds: '15',
    });
  });

  it('accepts leading zeros and keeps zero as unlimited', () => {
    expect(mergeDurationParts('002', '005')).toBe(125);
    expect(mergeDurationParts('0', '0')).toBe(0);
  });

  it.each([
    ['-1', '0'],
    ['2', '-5'],
    ['x', '5'],
    ['2', 'five'],
    ['', '0'],
    ['0', ''],
    ['9007199254740992', '0'],
    ['0', '9007199254740992'],
  ])('rejects invalid editable parts %j', (minutes, seconds) => {
    expect(mergeDurationParts(minutes, seconds)).toBeNull();
  });
});
