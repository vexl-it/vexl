import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Array, HashMap, Option} from 'effect/index'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {atom} from 'jotai'
import anonymizePhoneNumber from '../../../state/chat/utils/anonymizePhoneNumber'
import connectionStateAtom, {
  createFriendLevelInfoAtom,
} from '../../../state/connections/atom/connectionStateAtom'
import {sessionDataOrDummyAtom} from '../../../state/session'
import {anonymizedUserDataAtom} from '../../../state/session/userDataAtoms'
import {
  chatWithMessagesAtom,
  tradeChecklistDataAtom,
} from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {revealIdentityDialogUIAtom} from '../../RevealIdentityDialog/atoms'
import {revealIdentityActionAtom} from './updatesToBeSentAtom'

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

const friendLevelInfoAtom = atom((get) => {
  const chat = get(chatWithMessagesAtom)
  return get(createFriendLevelInfoAtom(chat.chat.otherSide))
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
      friendLevelInfoAtom,
    }),
    TE.map(({type, username, imageUri}) => {
      const identityData =
        type === 'DISAPPROVE_REVEAL'
          ? {
              status: type,
            }
          : {
              status: type,
              deanonymizedUser: {
                name: username ?? anonymizedUserData.userName,
                partialPhoneNumber: anonymizedPhoneNumber,
              },
              image: imageUri,
            }

      set(revealIdentityActionAtom, identityData)
    })
  )
})
