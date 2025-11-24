import {type IdentityReveal} from '@vexl-next/domain/src/general/tradeChecklist'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Array, Effect, HashMap, Option} from 'effect'
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
    return HashMap.get(
      connectionState.commonFriends,
      chat.chat.otherSide.publicKey
    ).pipe(
      Option.getOrElse(() => []),
      Array.length
    )

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

  return Effect.gen(function* (_) {
    const result = yield* _(
      set(revealIdentityDialogUIAtom, {
        type,
        revealIdentityUsernameAtom,
        usernameSavedForFutureUseAtom,
        revealIdentityImageUriAtom,
        imageSavedForFutureUseAtom,
        commonConnectionsCountAtom,
      })
    )

    const identityData = {
      status: result.type,
      deanonymizedUser: {
        name: result.username ?? anonymizedUserData.userName,
        partialPhoneNumber: anonymizedPhoneNumber,
      },
      image: result.imageUri,
    } satisfies IdentityReveal

    set(revealIdentityActionAtom, identityData)
  })
})

export const revealIdentityFromQuickActionBannerAtom = atom(
  null,
  async (get, set, chatIds: ChatIds) => {
    set(setParentChatActionAtom, chatIds)

    return await Effect.runPromise(
      Effect.gen(function* (_) {
        const result = yield* _(
          set(revealIdentityWithUiFeedbackAtom),
          Effect.either
        )

        if (result._tag === 'Left') {
          return false
        }

        return yield* _(set(submitTradeChecklistUpdatesActionAtom))
      })
    )
  }
)
