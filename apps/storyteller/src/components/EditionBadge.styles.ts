export function badgeStyle(s: (v: number) => number, color: string) {
  return {
    fontSize: s(9),
    fontWeight: '700' as const,
    color,
    borderWidth: 1,
    borderColor: color,
    borderRadius: 3,
    paddingHorizontal: s(4),
    paddingVertical: s(1),
    overflow: 'hidden' as const,
  };
}
