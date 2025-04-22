import {type IdentityReveal} from '@vexl-next/domain/src/general/tradeChecklist'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import {type ChatIds} from '../../../state/chat/domain'
import anonymizePhoneNumber from '../../../state/chat/utils/anonymizePhoneNumber'
import connectionStateAtom from '../../../state/connections/atom/connectionStateAtom'
import {sessionDataOrDummyAtom} from '../../../state/session'
import {anonymizedUserDataAtom} from '../../../state/session/userDataAtoms'
import {
  chatWithMessagesAtom,
  setParentChatActionAtom,
  tradeChecklistDataAtom,
} from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {revealIdentityDialogUIAtom} from '../../RevealIdentityDialog/atoms'
import {
  revealIdentityActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from './updatesToBeSentAtom'

const revealIdentityUsernameAtom = atom<string>('')
const usernameSavedForFutureUseAtom = atom<boolean>(false)
const revealIdentityImageUriAtom = atom<UriString | undefined>(undefined)
const imageSavedForFutureUseAtom = atom<boolean>(false)

const commonConnectionsCountAtom = atom((get) => {
  const chat = get(chatWithMessagesAtom)
  const connectionState = get(connectionStateAtom)

  if (chat.chat.origin.type === 'myOffer')
    return (
      connectionState.commonFriends.commonContacts.find(
        (contact) => contact.publicKey === chat.chat.otherSide.publicKey
      )?.common.hashes ?? []
    ).length

  if (chat.chat.origin.type === 'theirOffer')
    return (chat.chat.origin?.offer?.offerInfo.privatePart.commonFriends ?? [])
      .length

  return 0
})

export const revealIdentityWithUiFeedbackAtom = atom(null, (get, set) => {
  const {phoneNumber} = get(sessionDataOrDummyAtom)
  const anonymizedUserData = get(anonymizedUserDataAtom)
  const anonymizedPhoneNumber = anonymizePhoneNumber(phoneNumber)
  const tradeChecklistData = get(tradeChecklistDataAtom)
  const type =
    !tradeChecklistData.identity.sent && tradeChecklistData.identity.received
      ? 'RESPOND_REVEAL'
      : 'REQUEST_REVEAL'

  return pipe(
    set(revealIdentityDialogUIAtom, {
      type,
      revealIdentityUsernameAtom,
      usernameSavedForFutureUseAtom,
      revealIdentityImageUriAtom,
      imageSavedForFutureUseAtom,
      commonConnectionsCountAtom,
    }),
    TE.map(({type, username, imageUri}) => {
      const identityData = {
        status: type,
        deanonymizedUser: {
          name: username ?? anonymizedUserData.userName,
          partialPhoneNumber: anonymizedPhoneNumber,
        },
        image: imageUri,
      } satisfies IdentityReveal

      set(revealIdentityActionAtom, identityData)
    })
  )
})

export const revealIdentityFromQuickActionBannerAtom = atom(
  null,
  async (get, set, chatIds: ChatIds) => {
    set(setParentChatActionAtom, chatIds)

    return await pipe(
      set(revealIdentityWithUiFeedbackAtom),
      TE.matchW(
        (l) => {
          return T.of(false)
        },
        (r) => {
          return set(submitTradeChecklistUpdatesActionAtom)()
        }
      )
    )()
  }
)
