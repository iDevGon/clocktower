import type { NightFeedbackPayload, Player, Team } from '@clocktower/shared';
import { NumberFeedback } from './feedback/NumberFeedback';
import { PlayersAndRoleFeedback } from './feedback/PlayersAndRoleFeedback';
import { RoleFeedback } from './feedback/RoleFeedback';
import { YesNoFeedback } from './feedback/YesNoFeedback';

interface FeedbackComposerProps {
  feedbackDef: { type: string; roleTeamFilter?: Team; allowNone?: boolean };
  players: Player[];
  isDrunkUser?: boolean;
  suggestedNumber?: number;
  onSend: (feedback: NightFeedbackPayload) => void;
}

export function FeedbackComposer({
  feedbackDef,
  players,
  isDrunkUser,
  suggestedNumber,
  onSend,
}: FeedbackComposerProps) {
  switch (feedbackDef.type) {
    case 'number':
      return (
        <NumberFeedback suggestedNumber={suggestedNumber} onSend={onSend} />
      );
    case 'yes_no':
      return <YesNoFeedback onSend={onSend} />;
    case 'players_and_role':
      return (
        <PlayersAndRoleFeedback
          players={players}
          teamFilter={feedbackDef.roleTeamFilter as Team}
          allowNone={feedbackDef.allowNone}
          isDrunkUser={isDrunkUser}
          onSend={onSend}
        />
      );
    case 'role':
      return <RoleFeedback onSend={onSend} />;
    default:
      return null;
  }
}
