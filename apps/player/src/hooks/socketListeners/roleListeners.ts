import { getRoleById } from '@clocktower/shared';
import { usePlayerStore } from '../../stores/playerStore';
import type { AppSocket } from './types';

export function attachRoleListeners(socket: AppSocket) {
  socket.on('role:assign', ({ roleId, drunkAs }) => {
    const { role: prevRole, currentPhase } = usePlayerStore.getState();
    const role = getRoleById(roleId) ?? null;
    // Detect mid-game role promotion (e.g. Scarlet Woman → Imp)
    const isPromotion =
      prevRole && role && currentPhase !== 'setup' && prevRole.id !== role.id;
    if (isPromotion && currentPhase === 'night') {
      // During night: defer the reveal until day
      usePlayerStore.getState().set({
        role,
        drunkAs: drunkAs ?? null,
        pendingRolePromotion: role,
      });
    } else {
      usePlayerStore.getState().set({
        role,
        drunkAs: drunkAs ?? null,
        rolePromotion: isPromotion ? role : null,
      });
    }
  });

  socket.on('evil:info', (data) => {
    usePlayerStore.getState().set({ evilInfo: data });
  });
}
