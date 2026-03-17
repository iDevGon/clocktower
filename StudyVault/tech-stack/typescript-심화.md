# TypeScript 심화

## 유니온과 인터섹션 타입

- **유니온 (`A | B`)**: A 또는 B — 값이 여러 타입 중 하나일 수 있을 때
- **인터섹션 (`A & B`)**: A이면서 B — 여러 타입을 결합할 때
- 판별 유니온(Discriminated Union): 공통 리터럴 필드로 타입 좁히기
  ```typescript
  type Action = { type: 'add'; value: number } | { type: 'remove'; id: string };
  ```

## 제네릭

- 타입을 매개변수화하여 재사용 가능한 타입/함수 정의
- `function identity<T>(arg: T): T { return arg; }`
- 제약 조건: `<T extends HasId>` — T가 특정 구조를 가져야 함
- 기본값: `<T = string>` — 타입 인수 생략 시 기본 타입 사용

## 유틸리티 타입

- `Partial<T>` — 모든 프로퍼티를 선택적으로
- `Required<T>` — 모든 프로퍼티를 필수로
- `Pick<T, K>` — 특정 프로퍼티만 선택
- `Omit<T, K>` — 특정 프로퍼티 제거
- `Record<K, V>` — 키 K, 값 V의 객체 타입
- `Readonly<T>` — 모든 프로퍼티를 읽기 전용으로
- `ReturnType<T>` — 함수의 반환 타입 추출
- `Parameters<T>` — 함수의 매개변수 타입 튜플 추출

## 타입 가드와 좁히기 (Narrowing)

- `typeof` — 원시 타입 좁히기
- `instanceof` — 클래스 인스턴스 좁히기
- `in` — 프로퍼티 존재 여부로 좁히기
- 사용자 정의 타입 가드: `function isString(x: unknown): x is string`
- `as const` — 리터럴 타입으로 좁히기 (widen 방지)

## 매핑된 타입 (Mapped Types)

```typescript
type Flags<T> = { [K in keyof T]: boolean };
```
- 기존 타입의 각 프로퍼티를 변환하여 새 타입 생성
- `+readonly`, `-optional` 등 수정자 사용 가능

## 조건부 타입

```typescript
type IsString<T> = T extends string ? 'yes' : 'no';
```
- `infer` 키워드로 타입 추론: `T extends Promise<infer R> ? R : T`
- 유니온에 대해 분배(distribute)됨

## 타입 vs 인터페이스

- **interface**: 선언 병합(declaration merging) 가능, `extends`로 확장
- **type**: 유니온, 인터섹션, 매핑된 타입 등 더 유연한 조합 가능
- 일반적 가이드: 객체 형태는 interface, 복잡한 타입 조합은 type
