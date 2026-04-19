import { cloneElement, type ReactElement } from 'react';
import { Text, TextInput, type TextProps } from 'react-native';
import { typography } from './tokens';

/**
 * 앱 시작 시 한 번 호출하여 `<Text>`·`<TextInput>` 기본 폰트를
 * Pretendard(body)로 설정한다.
 *
 * React Native 에는 전역 폰트 설정이 없어서 fontFamily 를 명시하지 않은
 * 모든 텍스트는 시스템 기본 폰트로 떨어진다. 이 유틸은 내장 Text 의
 * render 를 한 번 래핑하여 스타일이 지정되지 않은 경우에도 Pretendard
 * 가 적용되도록 한다. 이미 fontFamily 가 있는 스타일은 우선 적용된다.
 *
 * React 19 에서는 element.props 가 frozen 이므로 직접 할당이 불가능하다.
 * 반드시 `cloneElement` 로 새 element 를 만들어 반환해야 한다.
 */
let applied = false;

export function applyDefaultFonts(): void {
  if (applied) return;
  applied = true;

  const bodyFont = { fontFamily: typography.family.body };

  for (const Comp of [Text, TextInput] as const) {
    const C = Comp as unknown as {
      render?: (
        props: unknown,
        ref: unknown,
      ) => ReactElement<TextProps> | null;
    };
    const originalRender = C.render;
    if (!originalRender) continue;
    C.render = function wrappedRender(props: unknown, ref: unknown) {
      const element = originalRender.call(this, props, ref);
      if (!element) return element;
      const existingStyle = element.props?.style;
      return cloneElement(element, {
        style: existingStyle ? [bodyFont, existingStyle] : bodyFont,
      } as Partial<TextProps>);
    };
  }
}
