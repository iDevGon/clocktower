import { describe, expect, it } from 'vitest';
import {
  canonicalizeDurationParts,
  createDurationDraft,
  formatDurationOption,
  getDurationDraftStatus,
  mergeDurationParts,
  reduceDurationDraft,
  splitDurationSeconds,
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

describe('duration draft reducer', () => {
  it('syncs clean drafts from an external value', () => {
    expect(
      reduceDurationDraft(createDurationDraft(30), {
        type: 'sync',
        value: 125,
      }),
    ).toEqual(createDurationDraft(125));
  });

  it('preserves a dirty draft through stale external echoes', () => {
    const dirtyDraft = reduceDurationDraft(createDurationDraft(30), {
      type: 'edit',
      part: 'minutes',
      value: '03',
    });

    expect(
      reduceDurationDraft(dirtyDraft, { type: 'sync', value: 30 }),
    ).toEqual(dirtyDraft);
  });

  it('rejects invalid drafts for apply without changing the draft', () => {
    const invalidDraft = reduceDurationDraft(createDurationDraft(125), {
      type: 'edit',
      part: 'seconds',
      value: '',
    });

    expect(getDurationDraftStatus(invalidDraft, 125)).toEqual({
      totalSeconds: null,
      canApply: false,
      error: '분과 초를 숫자로 입력하세요',
    });
    expect(reduceDurationDraft(invalidDraft, { type: 'apply' })).toEqual(
      invalidDraft,
    );
  });

  it.each([
    [{ minutes: '03', seconds: '015' }, 195, { minutes: '3', seconds: '15' }],
    [{ minutes: '0', seconds: '75' }, 75, { minutes: '1', seconds: '15' }],
    [{ minutes: '0', seconds: '0' }, 0, { minutes: '0', seconds: '0' }],
  ])('canonicalizes valid draft %o for a single apply', (parts, total, canonical) => {
    const draft = { parts, isDirty: true };

    expect(getDurationDraftStatus(draft, 125)).toMatchObject({
      totalSeconds: total,
      canApply: total !== 125,
    });
    expect(reduceDurationDraft(draft, { type: 'apply' })).toEqual({
      parts: canonical,
      isDirty: false,
    });
    expect(
      getDurationDraftStatus(reduceDurationDraft(draft, { type: 'apply' }), 125)
        .canApply,
    ).toBe(false);
  });

  it('replaces a dirty draft with a preset before the immediate update', () => {
    const dirtyDraft = reduceDurationDraft(createDurationDraft(125), {
      type: 'edit',
      part: 'seconds',
      value: '99',
    });

    expect(
      reduceDurationDraft(dirtyDraft, { type: 'preset', value: 60 }),
    ).toEqual(createDurationDraft(60));
  });

  it('resets a dirty draft to the authoritative value', () => {
    const dirtyDraft = reduceDurationDraft(createDurationDraft(125), {
      type: 'edit',
      part: 'minutes',
      value: '9',
    });

    expect(
      reduceDurationDraft(dirtyDraft, { type: 'reset', value: 125 }),
    ).toEqual(createDurationDraft(125));
  });
});

describe('canonicalizeDurationParts', () => {
  it('leaves invalid drafts unchanged', () => {
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
