import { attachGameListeners } from './socketListeners/gameListeners';
import { attachNightListeners } from './socketListeners/nightListeners';
import { attachRoleListeners } from './socketListeners/roleListeners';
import { attachSocialListeners } from './socketListeners/socialListeners';
import type { AppSocket } from './socketListeners/types';
import { attachVoteListeners } from './socketListeners/voteListeners';

export type { AppSocket } from './socketListeners/types';

export function attachListeners(socket: AppSocket) {
  attachGameListeners(socket);
  attachNightListeners(socket);
  attachVoteListeners(socket);
  attachSocialListeners(socket);
  attachRoleListeners(socket);
}
