import { createContext, useContext } from 'react';

const ReducedMotionContext = createContext(false);

export const ReducedMotionProvider = ReducedMotionContext.Provider;

export function useReducedMotion(): boolean {
  return useContext(ReducedMotionContext);
}
