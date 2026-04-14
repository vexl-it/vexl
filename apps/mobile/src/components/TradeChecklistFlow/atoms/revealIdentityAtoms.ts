import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Option, Schema} from 'effect/index'
import {atom} from 'jotai'
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
import updatesToBeSentAtom from './updatesToBeSentAtom'

export const revealIdentityUsernameAtom = atom<string>('')
export const revealIdentityImageUriAtom = atom<UriString | undefined>(undefined)
export const revealIdentityPhoneNumberAtom = atom<boolean>(false)

export const revealIdentityFlowTypeAtom = atom((get) => {
  const tradeChecklistData = get(tradeChecklistDataAtom)
  const requestMessage = get(chatWithMessagesAtom).messages.find(
    (one) => one.message.messageType === 'REQUEST_REVEAL'
  )

  return !tradeChecklistData.identity.sent &&
    (tradeChecklistData.identity.received ||
      requestMessage?.state === 'received')
    ? 'RESPOND_REVEAL'
    : 'REQUEST_REVEAL'
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
  const shouldRevealPhoneNumber = get(revealIdentityPhoneNumberAtom)
  const revealIdentityType = get(revealIdentityFlowTypeAtom)
  const status =
    revealIdentityType === 'RESPOND_REVEAL'
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
            status,
            fullPhoneNumber: phoneNumber,
            timestamp,
          },
        }
      : {}),
  }))

  set(discardRevealIdentityDraftActionAtom)

  return true
})
