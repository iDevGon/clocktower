import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  titleSubtext: {
    color: '#b85c5c',
    fontSize: 12,
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  titleText: {
    color: '#e0ddd8',
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  titleDivider: {
    width: 64,
    height: 1,
    backgroundColor: '#943c3c',
    marginTop: 16,
  },
  form: {
    gap: 16,
  },
  label: {
    color: '#908e8a',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: '#1a1a1e',
    borderWidth: 1,
    borderColor: '#2e2e34',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#e0ddd8',
    fontSize: 16,
  },
  ipInput: {
    flex: 2,
  },
  codeInput: {
    flex: 1,
  },
  scanButton: {
    backgroundColor: '#1a1a1e',
    borderWidth: 1,
    borderColor: '#2e2e34',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonPressed: {
    backgroundColor: '#2e2e34',
  },
  scanButtonText: {
    color: '#908e8a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#b85c5c',
    fontSize: 14,
    textAlign: 'center',
  },
  joinButton: {
    backgroundColor: '#943c3c',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  joinButtonPressed: {
    backgroundColor: '#7a3030',
  },
  joinButtonText: {
    color: '#e0ddd8',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
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
  footerText: {
    color: '#5c5a58',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 48,
  },
});
