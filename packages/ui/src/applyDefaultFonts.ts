import type React from 'react';
import { Text, TextInput } from 'react-native';
import { typography } from './tokens';

/**
 * 앱 시작 시 한 번 호출하여 `<Text>`·`<TextInput>` 기본 폰트를
 * Pretendard(body)로 설정한다.
 *
 * React Native 에는 전역 폰트 설정이 없어서 fontFamily 를 명시하지 않은
 * 모든 텍스트는 시스템 기본 폰트로 떨어진다. 이 유틸은 내장 Text 의
 * render 를 한 번 래핑하여 스타일이 지정되지 않은 경우에도 Pretendard
 * 가 적용되도록 한다. 이미 fontFamily 가 있는 스타일은 우선 적용된다.
 */
let applied = false;

export function applyDefaultFonts(): void {
  if (applied) return;
  applied = true;

  const bodyFont = { fontFamily: typography.family.body };

  // React Native 의 Text · TextInput 은 내부적으로 forwardRef 이다.
  // 따라서 .render 를 래핑해 cloneElement 로 기본 style 을 prepend 한다.
  // (기존 스타일이 있으면 그 뒤에 병합되어 사용자 지정이 우선된다)
  for (const Comp of [Text, TextInput] as const) {
    const C = Comp as unknown as {
      render?: (props: unknown, ref: unknown) => React.ReactElement;
    };
    const originalRender = C.render;
    if (!originalRender) continue;
    C.render = function wrappedRender(props: unknown, ref: unknown) {
      const element = originalRender.call(this, props, ref);
      // biome-ignore lint/suspicious/noExplicitAny: cloneElement 대상 prop 타입 확장 용이성
      const p = (element as any).props;
      // biome-ignore lint/suspicious/noExplicitAny: React.cloneElement 를 직접 호출하지 않기 위해 inline mutate
      (element as any).props = {
        ...p,
        style: p?.style ? [bodyFont, p.style] : bodyFont,
      };
      return element;
    };
  }
}
