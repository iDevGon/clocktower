import { describe, expect, it } from 'vitest';
import {
  applyDurationPartEdit,
  canonicalizeDurationParts,
  formatDurationOption,
  mergeDurationParts,
  splitDurationSeconds,
  syncDurationParts,
} from '../durationInput';

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

  it('normalizes unsafe finite totals to unlimited', () => {
    expect(splitDurationSeconds(Number.MAX_SAFE_INTEGER + 1)).toEqual({
      minutes: '0',
      seconds: '0',
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

describe('duration input editing and synchronization', () => {
  it('keeps invalid draft text without emitting a total', () => {
    expect(
      applyDurationPartEdit({ minutes: '2', seconds: '5' }, 'seconds', ''),
    ).toEqual({
      parts: { minutes: '2', seconds: '' },
      totalSeconds: null,
    });
  });

  it('keeps active edits when a stale server echo arrives', () => {
    const draft = { minutes: '03', seconds: '015' };

    expect(syncDurationParts(0, draft, true)).toEqual(draft);
    expect(syncDurationParts(195, draft, true)).toEqual(draft);
  });

  it('immediately applies external or slider values when not editing', () => {
    expect(
      syncDurationParts(125, { minutes: '03', seconds: '015' }, false),
    ).toEqual({ minutes: '2', seconds: '5' });
  });

  it('canonicalizes valid drafts on final blur', () => {
    expect(
      canonicalizeDurationParts({ minutes: '03', seconds: '015' }),
    ).toEqual({ minutes: '3', seconds: '15' });
    expect(canonicalizeDurationParts({ minutes: '0', seconds: '75' })).toEqual({
      minutes: '1',
      seconds: '15',
    });
  });

  it('leaves invalid drafts unchanged when canonicalizing', () => {
    expect(canonicalizeDurationParts({ minutes: '3', seconds: '' })).toEqual({
      minutes: '3',
      seconds: '',
    });
  });
});

describe('formatDurationOption', () => {
  it('uses seconds or minutes with a remainder', () => {
    expect(formatDurationOption(45)).toBe('45초');
    expect(formatDurationOption(120)).toBe('2분');
    expect(formatDurationOption(125)).toBe('2분5초');
  });
});
