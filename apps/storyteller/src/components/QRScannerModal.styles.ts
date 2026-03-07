import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 24,
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  scanArea: {
    width: 240,
    height: 240,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#943c3c',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  scanHint: {
    color: '#e0ddd8',
    fontSize: 14,
    marginTop: 24,
  },
  scannerClose: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  scannerCloseText: {
    color: '#e0ddd8',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
