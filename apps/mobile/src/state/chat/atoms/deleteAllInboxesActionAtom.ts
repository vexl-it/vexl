import {generateSignedChallengeBatch} from '@vexl-next/resources-utils/src/chat/utils/generateSignedChallengesBatch'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {privateApiAtom} from '../../../api'
import {version} from '../../../utils/environment'
import {inboxesAtom} from '../../../utils/notifications/useRefreshNotificationTokenOnResumeAssumeLoggedIn'
import allChatsAtom from './allChatsAtom'
import messagingStateAtom from './messagingStateAtom'
import sendMessageToChatsInBatchActionAtom from './sendMessageToChatsInBatchActionAtom'

const deleteAllInboxesActionAtom = atom(null, (get, set) => {
  const api = get(privateApiAtom)
  const inboxes = get(inboxesAtom)
  const chats = get(allChatsAtom).flat()

  const sendDeleteInboxRequest = pipe(
    inboxes.map((one) => one.privateKey),
    generateSignedChallengeBatch(api.chat),
    TE.chainFirstW((challenges) =>
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

  const sendMessageInBatch = set(sendMessageToChatsInBatchActionAtom, {
    chats,
    isTerminationMessage: true,
    messageData: {
      text: 'Inbox deleted',
      messageType: 'INBOX_DELETED',
      myVersion: version,
    },
  })

  return pipe(
    TE.Do,
    TE.chainFirstTaskK(() =>
      pipe(
        sendMessageInBatch,
        TE.match(
          () => {},
          () => {}
        )
      )
    ),
    TE.chainW(() => sendDeleteInboxRequest),
    TE.map((r) => {
      set(messagingStateAtom, [])
      return r
    })
  )
})

export default deleteAllInboxesActionAtom
