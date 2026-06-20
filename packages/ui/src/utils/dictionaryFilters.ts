import { EDITION_LABELS, type Role } from '@clocktower/shared';

export function filterDictionaryRoles(
  roles: Role[],
  options: { roleIds?: string[]; query?: string },
): Role[] {
  const allowedIds = options.roleIds ? new Set(options.roleIds) : null;
  const normalizedQuery = options.query?.trim().toLowerCase() ?? '';

  return roles.filter((role) => {
    if (allowedIds && !allowedIds.has(role.id)) return false;
    if (!normalizedQuery) return true;
    const editionLabel = EDITION_LABELS[role.edition] ?? role.edition;
    return [role.name, role.ability, role.id, editionLabel]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });
}
