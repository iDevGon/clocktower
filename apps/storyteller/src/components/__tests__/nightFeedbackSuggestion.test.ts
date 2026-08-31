import { describe, expect, it } from 'vitest';
import { getNightFeedbackSuggestion } from '../nightFeedbackSuggestion';

describe('getNightFeedbackSuggestion', () => {
  it.each([
    {
      input: {
        roleId: 'empath',
        isMalfunctioning: false,
        empathEvilCount: 1,
      },
      expected: { type: 'number', value: 1, reason: '악한 이웃 1명' },
    },
    {
      input: {
        roleId: 'chef',
        isMalfunctioning: false,
        chefEvilPairCount: 2,
      },
      expected: { type: 'number', value: 2, reason: '인접 악한 쌍 2개' },
    },
    {
      input: {
        roleId: 'juggler',
        isMalfunctioning: false,
        jugglerCorrectCount: 3,
      },
      expected: { type: 'number', value: 3, reason: '정답 추측 3개' },
    },
    {
      input: {
        roleId: 'fortune_teller',
        isMalfunctioning: false,
        fortuneTellerResult: true,
      },
      expected: {
        type: 'yes_no',
        value: true,
        reason: '악마 또는 붉은 청어 감지',
      },
    },
    {
      input: {
        roleId: 'undertaker',
        isMalfunctioning: false,
        revealedRoleName: '임프',
      },
      expected: {
        type: 'role',
        roleName: '임프',
        reason: '어젯밤 처형된 역할',
      },
    },
    {
      input: {
        roleId: 'ravenkeeper',
        isMalfunctioning: false,
        revealedRoleName: '수도사',
      },
      expected: {
        type: 'role',
        roleName: '수도사',
        reason: '선택한 플레이어의 역할',
      },
    },
  ])('$input.roleId의 완전한 근거에서 결정적 추천을 만든다', ({
    input,
    expected,
  }) => {
    expect(getNightFeedbackSuggestion(input)).toEqual(expected);
  });

  it.each([
    {
      input: {
        roleId: 'empath',
        isMalfunctioning: false,
        empathEvilCount: 0,
      },
      expected: { type: 'number', value: 0, reason: '악한 이웃 0명' },
    },
    {
      input: {
        roleId: 'chef',
        isMalfunctioning: false,
        chefEvilPairCount: 0,
      },
      expected: { type: 'number', value: 0, reason: '인접 악한 쌍 0개' },
    },
    {
      input: {
        roleId: 'juggler',
        isMalfunctioning: false,
        jugglerCorrectCount: 0,
      },
      expected: { type: 'number', value: 0, reason: '정답 추측 0개' },
    },
    {
      input: {
        roleId: 'fortune_teller',
        isMalfunctioning: false,
        fortuneTellerResult: false,
      },
      expected: {
        type: 'yes_no',
        value: false,
        reason: '악마 또는 붉은 청어 미감지',
      },
    },
  ])('유효한 0과 false를 추천값으로 보존한다', ({ input, expected }) => {
    expect(getNightFeedbackSuggestion(input)).toEqual(expected);
  });

  it('선택 가능한 최댓값인 요리사 3쌍을 추천한다', () => {
    expect(
      getNightFeedbackSuggestion({
        roleId: 'chef',
        isMalfunctioning: false,
        chefEvilPairCount: 3,
      }),
    ).toEqual({ type: 'number', value: 3, reason: '인접 악한 쌍 3개' });
  });

  it('숫자 컨트롤에서 선택할 수 없는 요리사 4쌍은 추천하지 않는다', () => {
    expect(
      getNightFeedbackSuggestion({
        roleId: 'chef',
        isMalfunctioning: false,
        chefEvilPairCount: 4,
      }),
    ).toBeNull();
  });

  it.each([
    { roleId: 'undertaker', reason: '어젯밤 처형된 역할' },
    { roleId: 'ravenkeeper', reason: '선택한 플레이어의 역할' },
  ])('$roleId 역할 이름의 바깥쪽 공백을 제거한다', ({ roleId, reason }) => {
    expect(
      getNightFeedbackSuggestion({
        roleId,
        isMalfunctioning: false,
        revealedRoleName: '  임프  ',
      }),
    ).toEqual({ type: 'role', roleName: '임프', reason });
  });

  it.each([
    {
      roleId: 'empath',
      isMalfunctioning: true,
      empathEvilCount: 1,
    },
    {
      roleId: 'chef',
      isMalfunctioning: true,
      chefEvilPairCount: 1,
    },
    {
      roleId: 'juggler',
      isMalfunctioning: true,
      jugglerCorrectCount: 1,
    },
    {
      roleId: 'fortune_teller',
      isMalfunctioning: true,
      fortuneTellerResult: true,
    },
    {
      roleId: 'undertaker',
      isMalfunctioning: true,
      revealedRoleName: '임프',
    },
    {
      roleId: 'ravenkeeper',
      isMalfunctioning: true,
      revealedRoleName: '수도사',
    },
  ])('오작동 중인 $roleId의 실제값 추천을 항상 숨긴다', (input) => {
    expect(getNightFeedbackSuggestion(input)).toBeNull();
  });

  it.each([
    { roleId: 'washerwoman', isMalfunctioning: false },
    { roleId: 'empath', isMalfunctioning: false },
    { roleId: 'chef', isMalfunctioning: false },
    { roleId: 'juggler', isMalfunctioning: false },
    { roleId: 'fortune_teller', isMalfunctioning: false },
    { roleId: 'undertaker', isMalfunctioning: false },
    { roleId: 'ravenkeeper', isMalfunctioning: false },
  ])('지원하지 않거나 근거가 누락된 $roleId에는 추천하지 않는다', (input) => {
    expect(getNightFeedbackSuggestion(input)).toBeNull();
  });

  it.each([
    { roleId: 'empath', empathEvilCount: -1 },
    { roleId: 'empath', empathEvilCount: 3 },
    { roleId: 'chef', chefEvilPairCount: Number.NaN },
    { roleId: 'chef', chefEvilPairCount: 1.5 },
    { roleId: 'juggler', jugglerCorrectCount: -1 },
    { roleId: 'juggler', jugglerCorrectCount: 6 },
    { roleId: 'fortune_teller', fortuneTellerResult: 'yes' },
    { roleId: 'undertaker', revealedRoleName: '' },
    { roleId: 'ravenkeeper', revealedRoleName: '   ' },
  ])('$roleId의 잘못된 근거에는 추천하지 않는다', (evidence) => {
    expect(
      getNightFeedbackSuggestion({
        ...evidence,
        isMalfunctioning: false,
      }),
    ).toBeNull();
  });
});
