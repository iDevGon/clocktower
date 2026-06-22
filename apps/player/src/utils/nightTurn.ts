export function isNightWakeUpForCurrentRole(
  roleId: string | null | undefined,
  philosopherGrantedRoleId: string | null | undefined,
  nightWakeUpRoleId: string | null | undefined,
): boolean {
  if (!roleId || !nightWakeUpRoleId) return false;
  const effectiveRoleId =
    roleId === 'philosopher' && philosopherGrantedRoleId
      ? philosopherGrantedRoleId
      : roleId;
  return effectiveRoleId === nightWakeUpRoleId;
}
