import {atom} from 'jotai'
import {privateApiAtom} from '../../../api'
import {inboxesAtom} from '../../../utils/notifications/useRefreshNotificationTokenOnResumeAssumeLoggedIn'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {generateSignedChallengeBatch} from '@vexl-next/resources-utils/dist/chat/utils/generateSignedChallengesBatch'

const deleteAllInboxesActionAtom = atom(null, (get, set) => {
  const api = get(privateApiAtom)
  const inboxes = get(inboxesAtom)

  return pipe(
    // TODO send user deleted to all chats
    inboxes.map((one) => one.privateKey),
    generateSignedChallengeBatch(api.chat),
    TE.chainW((challenges) =>
      api.chat.deleteInboxes({
        dataForRemoval: challenges.map((one) => ({
          publicKey: one.publicKey,
          signedChallenge: {
            challenge: one.challenge.challenge,
            signature: one.challenge.signature,
          },
        })),
      })
    )
  )
})

export default deleteAllInboxesActionAtom
