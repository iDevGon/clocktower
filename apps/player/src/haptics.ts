import * as Haptics from 'expo-haptics';
import { Platform, Vibration } from 'react-native';

type AndroidVibrationPattern = number | number[];
type NotificationKind = 'error' | 'success' | 'warning';

const DEFAULT_ALERT_PATTERN = [0, 200, 100, 200];

const NOTIFICATION_FEEDBACK = {
  error: Haptics.NotificationFeedbackType.Error,
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
} satisfies Record<NotificationKind, Haptics.NotificationFeedbackType>;

export function hapticAlert(
  androidPattern: AndroidVibrationPattern = DEFAULT_ALERT_PATTERN,
): void {
  if (Platform.OS === 'ios') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(
      () => undefined,
    );
    return;
  }
  if (Platform.OS === 'android') Vibration.vibrate(androidPattern);
}

export function hapticNotification(
  kind: NotificationKind,
  androidPattern: AndroidVibrationPattern,
): void {
  if (Platform.OS === 'ios') {
    void Haptics.notificationAsync(NOTIFICATION_FEEDBACK[kind]).catch(
      () => undefined,
    );
    return;
  }
  if (Platform.OS === 'android') Vibration.vibrate(androidPattern);
}

export function hapticSelection(
  androidPattern: AndroidVibrationPattern = 80,
): void {
  if (Platform.OS === 'ios') {
    void Haptics.selectionAsync().catch(() => undefined);
    return;
  }
  if (Platform.OS === 'android') Vibration.vibrate(androidPattern);
}
