import { type BarcodeScanningResult, CameraView } from 'expo-camera';
import { useCallback, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { styles } from '../styles/index.styles';

const SCAN_AREA_SIZE = 240;

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
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const processedRef = useRef(false);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCameraLayout({ width, height });
  }, []);

  const handleBarcode = useCallback(
    (result: BarcodeScanningResult) => {
      if (processedRef.current) return;
      const { width, height } = cameraLayout;
      if (width === 0 || height === 0) return;

      // 스캔 영역 중심 좌표 (화면 중앙)
      const areaLeft = (width - SCAN_AREA_SIZE) / 2;
      const areaTop = (height - SCAN_AREA_SIZE) / 2;
      const areaRight = areaLeft + SCAN_AREA_SIZE;
      const areaBottom = areaTop + SCAN_AREA_SIZE;

      // cornerPoints가 있으면 중심점 계산, 없으면 bounds 사용
      const cp = result.cornerPoints;
      let cx: number;
      let cy: number;
      if (cp && cp.length >= 4) {
        cx = cp.reduce((s, p) => s + p.x, 0) / cp.length;
        cy = cp.reduce((s, p) => s + p.y, 0) / cp.length;
      } else if (result.bounds) {
        cx = result.bounds.origin.x + result.bounds.size.width / 2;
        cy = result.bounds.origin.y + result.bounds.size.height / 2;
      } else {
        // 좌표 정보 없으면 그냥 통과
        processedRef.current = true;
        onBarcodeScanned(result);
        return;
      }

      // 스캔 영역 밖이면 무시 (여유 마진 20% 추가)
      const margin = SCAN_AREA_SIZE * 0.2;
      if (
        cx < areaLeft - margin ||
        cx > areaRight + margin ||
        cy < areaTop - margin ||
        cy > areaBottom + margin
      )
        return;

      processedRef.current = true;
      onBarcodeScanned(result);
    },
    [cameraLayout, onBarcodeScanned],
  );

  // 모달이 열릴 때마다 처리 상태 초기화
  if (!visible) {
    processedRef.current = false;
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.scannerContainer} onLayout={onLayout}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcode}
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
