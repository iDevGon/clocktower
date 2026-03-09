import { useWindowDimensions } from 'react-native';

type DeviceType = 'phone' | 'tablet' | 'desktop';

interface ResponsiveValues {
  device: DeviceType;
  width: number;
  height: number;
  tokenSize: number;
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  topBarPadding: number;
  panelPadding: number;
  buttonHeight: number;
}

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();

  const device: DeviceType =
    width >= 1024 ? 'desktop' : width >= 768 ? 'tablet' : 'phone';

  const scale = device === 'desktop' ? 1.3 : device === 'tablet' ? 1.15 : 1;

  return {
    device,
    width,
    height,
    tokenSize: Math.round(80 * scale),
    fontSize: {
      xs: Math.round(8 * scale),
      sm: Math.round(10 * scale),
      md: Math.round(12 * scale),
      lg: Math.round(14 * scale),
      xl: Math.round(16 * scale),
    },
    spacing: {
      xs: Math.round(4 * scale),
      sm: Math.round(8 * scale),
      md: Math.round(12 * scale),
      lg: Math.round(16 * scale),
      xl: Math.round(24 * scale),
    },
    topBarPadding: Math.round(12 * scale),
    panelPadding: Math.round(8 * scale),
    buttonHeight: Math.round(36 * scale),
  };
}
