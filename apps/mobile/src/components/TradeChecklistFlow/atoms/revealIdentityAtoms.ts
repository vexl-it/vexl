import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Array, Option, Schema, pipe} from 'effect/index'
import {atom} from 'jotai'
import {type ChatMessageWithState} from '../../../state/chat/domain'
import anonymizePhoneNumber from '../../../state/chat/utils/anonymizePhoneNumber'
import {sessionDataOrDummyAtom} from '../../../state/session'
import {
  anonymizedUserDataAtom,
  invalidUsernameUIFeedbackAtom,
  realUserImageAtom,
  realUserNameAtom,
} from '../../../state/session/userDataAtoms'
import {
  chatWithMessagesAtom,
  tradeChecklistDataAtom,
} from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import getIdentityRevealStatus from '../../../state/tradeChecklist/utils/getIdentityRevealStatus'
import {revealIdentityFlowTypeFromStatus} from './revealIdentityFlowType'
import updatesToBeSentAtom from './updatesToBeSentAtom'

export const revealIdentityUsernameAtom = atom<string>('')
export const revealIdentityImageUriAtom = atom<UriString | undefined>(undefined)
export const revealIdentityPhoneNumberAtom = atom<boolean>(false)

function isReceivedContactRevealRequestMessage(
  message: ChatMessageWithState
): boolean {
  return (
    message.state === 'received' &&
    (message.message.messageType === 'REQUEST_CONTACT_REVEAL' ||
      message.message.tradeChecklistUpdate?.contact?.status ===
        'REQUEST_REVEAL')
  )
}

export const revealIdentityFlowTypeAtom = atom((get) => {
  return revealIdentityFlowTypeFromStatus(
    getIdentityRevealStatus(get(chatWithMessagesAtom))
  )
})

const receivedContactRevealRequestAtom = atom((get) => {
  const tradeChecklistData = get(tradeChecklistDataAtom)

  return (
    tradeChecklistData.contact.received?.status === 'REQUEST_REVEAL' ||
    pipe(
      get(chatWithMessagesAtom).messages,
      Array.some(isReceivedContactRevealRequestMessage)
    )
  )
})

export const showRevealIdentityPhoneNumberCheckboxAtom = atom((get) => {
  return (
    get(revealIdentityFlowTypeAtom) === 'REQUEST_REVEAL' ||
    get(receivedContactRevealRequestAtom)
  )
})

export const shouldOpenRevealIdentitySummaryAtom = atom((get) => {
  const updates = get(updatesToBeSentAtom)
  const realUserName = get(realUserNameAtom)
  const realUserImage = get(realUserImageAtom)

  return (
    Boolean(updates.identity) ||
    Boolean(realUserName && realUserImage?.type === 'imageUri')
  )
})

export const revealIdentityPreviewImageAtom = atom((get) => {
  const revealIdentityImageUri = get(revealIdentityImageUriAtom)

  if (revealIdentityImageUri) {
    return {
      type: 'imageUri',
      imageUri: revealIdentityImageUri,
    } as const
  }

  return get(anonymizedUserDataAtom).image
})

export const prepareRevealIdentityDraftActionAtom = atom(null, (get, set) => {
  const updates = get(updatesToBeSentAtom)
  const realUserName = get(realUserNameAtom)
  const realUserImage = get(realUserImageAtom)

  const draftedImage =
    updates.identity?.status === 'DISAPPROVE_REVEAL'
      ? undefined
      : updates.identity?.image

  set(
    revealIdentityUsernameAtom,
    updates.identity?.deanonymizedUser?.name ?? realUserName ?? ''
  )
  set(
    revealIdentityImageUriAtom,
    draftedImage ??
      (realUserImage?.type === 'imageUri' ? realUserImage.imageUri : undefined)
  )
  set(revealIdentityPhoneNumberAtom, Boolean(updates.contact))
})

export const discardRevealIdentityDraftActionAtom = atom(null, (_get, set) => {
  set(revealIdentityUsernameAtom, '')
  set(revealIdentityImageUriAtom, undefined)
  set(revealIdentityPhoneNumberAtom, false)
})

export const initializeEmptyRevealIdentityDraftFromProfileActionAtom = atom(
  null,
  (get, set) => {
    const realUserName = get(realUserNameAtom)
    const realUserImage = get(realUserImageAtom)

    if (!get(revealIdentityUsernameAtom).trim() && realUserName) {
      set(revealIdentityUsernameAtom, realUserName)
    }

    if (
      !get(revealIdentityImageUriAtom) &&
      realUserImage?.type === 'imageUri'
    ) {
      set(revealIdentityImageUriAtom, realUserImage.imageUri)
    }
  }
)

export const saveRevealIdentityDraftActionAtom = atom(null, (get, set) => {
  const parsedUserName = Schema.decodeUnknownOption(UserName)(
    get(revealIdentityUsernameAtom).trim()
  )

  if (Option.isNone(parsedUserName)) {
    void set(invalidUsernameUIFeedbackAtom)
    return false
  }

  const {phoneNumber} = get(sessionDataOrDummyAtom)
  const revealIdentityImageUri = get(revealIdentityImageUriAtom)
  const revealIdentityType = get(revealIdentityFlowTypeAtom)
  const receivedContactRevealRequest = get(receivedContactRevealRequestAtom)
  const shouldRevealPhoneNumber =
    get(showRevealIdentityPhoneNumberCheckboxAtom) &&
    get(revealIdentityPhoneNumberAtom)
  const status =
    revealIdentityType === 'RESPOND_REVEAL'
      ? 'APPROVE_REVEAL'
      : 'REQUEST_REVEAL'
  const contactRevealStatus =
    revealIdentityType === 'RESPOND_REVEAL' && receivedContactRevealRequest
      ? 'APPROVE_REVEAL'
      : 'REQUEST_REVEAL'
  const timestamp = unixMillisecondsNow()

  set(realUserNameAtom, parsedUserName.value)
  set(
    realUserImageAtom,
    revealIdentityImageUri
      ? {
          type: 'imageUri',
          imageUri: revealIdentityImageUri,
        }
      : undefined
  )

  set(updatesToBeSentAtom, ({contact: _contact, ...updates}) => ({
    ...updates,
    identity: {
      status,
      deanonymizedUser: {
        name: parsedUserName.value,
        partialPhoneNumber: anonymizePhoneNumber(phoneNumber),
      },
      image: revealIdentityImageUri,
      timestamp,
    },
    ...(shouldRevealPhoneNumber
      ? {
          contact: {
            status: contactRevealStatus,
            fullPhoneNumber: phoneNumber,
            timestamp,
          },
        }
      : {}),
  }))

  set(discardRevealIdentityDraftActionAtom)

  return true
})
