import { CameraView } from 'expo-camera';
import { Modal, Pressable, Text, View } from 'react-native';
import { styles } from '../styles/index.styles';

interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (result: { data: string }) => void;
}

export function QrScannerModal({
  visible,
  onClose,
  onBarcodeScanned,
}: QrScannerModalProps) {
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onBarcodeScanned}
        />
        <View style={styles.overlay}>
          <View style={styles.overlayMask} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlayMask} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.overlayMask} />
          </View>
          <View style={styles.overlayMask}>
            <Text style={styles.scanHint}>진행자 화면의 QR을 스캔하세요</Text>
          </View>
        </View>
        <Pressable style={styles.scannerClose} onPress={onClose}>
          <Text style={styles.scannerCloseText}>닫기</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
