import { describe, expect, it } from 'vitest';
import { getChosung, isChosungOnly, matchQuery } from '../chosung.js';

describe('getChosung', () => {
  it('한글 완성형을 초성으로 변환한다', () => {
    expect(getChosung('세탁부')).toBe('ㅅㅌㅂ');
    expect(getChosung('임프')).toBe('ㅇㅍ');
    expect(getChosung('점쟁이')).toBe('ㅈㅈㅇ');
  });

  it('비한글 문자는 그대로 통과한다', () => {
    expect(getChosung('abc')).toBe('abc');
    expect(getChosung('123')).toBe('123');
    expect(getChosung('a한b')).toBe('aㅎb');
  });
});

describe('isChosungOnly', () => {
  it('초성만으로 이루어진 문자열은 true', () => {
    expect(isChosungOnly('ㅅㅌㅂ')).toBe(true);
    expect(isChosungOnly('ㄱ')).toBe(true);
  });

  it('완성형이 포함되면 false', () => {
    expect(isChosungOnly('세탁부')).toBe(false);
    expect(isChosungOnly('ㅅ탁')).toBe(false);
  });

  it('빈 문자열은 true', () => {
    expect(isChosungOnly('')).toBe(true);
  });
});

describe('matchQuery', () => {
  it('부분 문자열 매칭', () => {
    expect(matchQuery('세탁부', '세탁')).toBe(true);
    expect(matchQuery('세탁부', '탁부')).toBe(true);
  });

  it('초성 매칭', () => {
    expect(matchQuery('세탁부', 'ㅅㅌ')).toBe(true);
    expect(matchQuery('세탁부', 'ㅅㅌㅂ')).toBe(true);
  });

  it('대소문자 무시', () => {
    expect(matchQuery('Imp', 'imp')).toBe(true);
    expect(matchQuery('imp', 'IMP')).toBe(true);
  });

  it('불일치 시 false', () => {
    expect(matchQuery('세탁부', '점쟁')).toBe(false);
    expect(matchQuery('세탁부', 'ㅈㅉ')).toBe(false);
  });
});
