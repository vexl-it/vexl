import {type ChatChallenge} from '@vexl-next/rest-api/src/services/chat/contracts'
import {Context, Effect} from 'effect'

export const validateChatChallenge = (challengeString: ChatChallenge) =>
  Effect.gen(function* (_) {})

export interface InboxChallengeOperations {}

export class InboxChallengeService extends Context.Tag('InboxChallengeService')<
  InboxChallengeService,
  InboxChallengeOperations
>() {}
