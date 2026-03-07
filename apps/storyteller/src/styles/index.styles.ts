import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    color: '#e0ddd8',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#b85c5c',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 48,
  },
  label: {
    color: '#908e8a',
    fontSize: 18,
    marginBottom: 24,
  },
  form: {
    width: '100%',
    gap: 12,
  },
  inputRow: {
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
  inputFlex: {
    flex: 1,
  },
  qrButton: {
    backgroundColor: '#1a1a1e',
    borderWidth: 1,
    borderColor: '#2e2e34',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrButtonPressed: {
    backgroundColor: '#2e2e34',
  },
  qrButtonText: {
    color: '#908e8a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#b85c5c',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#943c3c',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    backgroundColor: '#7a3030',
  },
  buttonText: {
    color: '#e0ddd8',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
