import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Array, Option, pipe, Schema} from 'effect/index'
import {atom} from 'jotai'
import {pickedPhoneNumberOrMain} from '../../../state/session/sessionPhoneNumbers'
import {
  invalidUsernameUIFeedbackAtom,
  realUserImageAtom,
  realUserNameAtom,
  userPhoneNumbersAtom,
} from '../../../state/session/userDataAtoms'
import {chatWithMessagesAtom} from '../../../state/tradeChecklist/atoms/fromChatAtoms'
import {
  clearUpdatesToBeSentActionAtom,
  updatesToBeSentAtom,
} from '../../../state/tradeChecklist/atoms/updatesToBeSentAtom'
import {
  defaultPhoneNumberToReveal,
  detailsSharedByThem,
  EXCHANGE_DETAIL_KEYS,
  isAnyDetailSelected,
  NO_DETAILS_SELECTED,
  otherSideSupportsPhotoOnlyExchange,
  pendingRequest,
  pendingRequestFromThem,
  revealFromSelection,
  selectionFromReveal,
  type ExchangeDetailKey,
  type ExchangeDetailsSelection,
} from '../../../state/tradeChecklist/utils/exchangeDetails'
import {submitTradeChecklistUpdatesActionAtom} from './updatesToBeSentAtom'

export const exchangeDetailsSelectionAtom =
  atom<ExchangeDetailsSelection>(NO_DETAILS_SELECTED)
export const exchangeDetailsNicknameAtom = atom<string>('')
export const exchangeDetailsPhotoUriAtom = atom<UriString | undefined>(
  undefined
)
const pickedPhoneNumberAtom = atom<E164PhoneNumber | undefined>(undefined)

// One number for both the nickname's partial number and the full number.
export const exchangeDetailsPhoneNumberAtom = atom(
  (get) =>
    pickedPhoneNumberOrMain(
      get(userPhoneNumbersAtom),
      get(pickedPhoneNumberAtom)
    ),
  (_get, set, phoneNumber: E164PhoneNumber) => {
    set(pickedPhoneNumberAtom, phoneNumber)
  }
)

export const requestedDetailsAtom = atom((get) =>
  pendingRequestFromThem(get(chatWithMessagesAtom))
)

export const detailsSharedByThemAtom = atom((get) =>
  detailsSharedByThem(get(chatWithMessagesAtom).chat)
)

export const availableDetailKeysAtom = atom((get) => {
  const sharedByThem = get(detailsSharedByThemAtom)
  const requested = get(requestedDetailsAtom)

  return pipe(
    EXCHANGE_DETAIL_KEYS,
    Array.filter((key) => requested[key] || !sharedByThem[key])
  )
})

const pendingSentRequestAtom = atom((get) =>
  pendingRequest({chat: get(chatWithMessagesAtom), direction: 'sent'})
)

export const pendingSentDetailsAtom = atom((get) =>
  selectionFromReveal(get(pendingSentRequestAtom))
)

export type ExchangeDetailsMode = 'respond' | 'pending' | 'complete' | 'request'

export const exchangeDetailsModeAtom = atom((get): ExchangeDetailsMode => {
  if (isAnyDetailSelected(get(requestedDetailsAtom))) return 'respond'
  if (isAnyDetailSelected(get(pendingSentDetailsAtom))) return 'pending'
  if (!Array.isNonEmptyArray(get(availableDetailKeysAtom))) return 'complete'
  return 'request'
})

// Sends the unanswered request again, with the same details.
export const prepareAskAgainActionAtom = atom(null, (get, set) => {
  const {identity, contact} = get(pendingSentRequestAtom)
  const timestamp = unixMillisecondsNow()

  set(updatesToBeSentAtom, (updates) => ({
    ...updates,
    ...(identity ? {identity: {...identity, timestamp}} : {}),
    ...(contact ? {contact: {...contact, timestamp}} : {}),
  }))
})

export const photoRequiresNicknameAtom = atom(
  (get) => !otherSideSupportsPhotoOnlyExchange(get(chatWithMessagesAtom).chat)
)

export const toggleExchangeDetailActionAtom = atom(
  null,
  (get, set, key: ExchangeDetailKey) => {
    const current = get(exchangeDetailsSelectionAtom)
    const next = {...current, [key]: !current[key]}

    if (get(photoRequiresNicknameAtom)) {
      if (key === 'photo' && next.photo) next.nickname = true
      if (key === 'nickname' && !next.nickname) next.photo = false
    }

    set(exchangeDetailsSelectionAtom, next)
  }
)

export const canSubmitExchangeDetailsAtom = atom((get) => {
  const selection = get(exchangeDetailsSelectionAtom)

  if (!isAnyDetailSelected(selection)) return false
  if (selection.nickname && !get(exchangeDetailsNicknameAtom).trim())
    return false
  if (selection.photo && !get(exchangeDetailsPhotoUriAtom)) return false
  return true
})

export const prepareExchangeDetailsDraftActionAtom = atom(null, (get, set) => {
  const updates = get(updatesToBeSentAtom)
  const realUserImage = get(realUserImageAtom)
  const draftedSelection =
    updates.identity || updates.contact
      ? selectionFromReveal(updates)
      : get(requestedDetailsAtom)

  set(exchangeDetailsSelectionAtom, draftedSelection)
  set(
    pickedPhoneNumberAtom,
    defaultPhoneNumberToReveal({
      accountPhoneNumbers: get(userPhoneNumbersAtom),
      chat: get(chatWithMessagesAtom),
      draft: updates,
    })
  )
  set(
    exchangeDetailsNicknameAtom,
    updates.identity?.deanonymizedUser?.name ?? get(realUserNameAtom) ?? ''
  )
  set(
    exchangeDetailsPhotoUriAtom,
    updates.identity?.image ??
      (realUserImage?.type === 'imageUri' ? realUserImage.imageUri : undefined)
  )
})

export const discardExchangeDetailsDraftActionAtom = atom(null, (_get, set) => {
  set(exchangeDetailsSelectionAtom, NO_DETAILS_SELECTED)
  set(exchangeDetailsNicknameAtom, '')
  set(exchangeDetailsPhotoUriAtom, undefined)
  set(pickedPhoneNumberAtom, undefined)
})

// The draft must be restored from `updatesToBeSentAtom` before it is cleared,
// so a failed submit cannot leak into another chat's checklist send.
export const restoreExchangeDetailsDraftAfterFailedSubmitActionAtom = atom(
  null,
  (_get, set) => {
    set(prepareExchangeDetailsDraftActionAtom)
    set(clearUpdatesToBeSentActionAtom)
  }
)

export const saveExchangeDetailsDraftActionAtom = atom(
  null,
  (get, set): boolean => {
    const selection = get(exchangeDetailsSelectionAtom)

    const name = selection.nickname
      ? Schema.decodeUnknownOption(UserName)(
          get(exchangeDetailsNicknameAtom).trim()
        )
      : Option.none()
    if (selection.nickname && Option.isNone(name)) {
      void set(invalidUsernameUIFeedbackAtom)
      return false
    }
    const photo = selection.photo ? get(exchangeDetailsPhotoUriAtom) : undefined

    if (Option.isSome(name)) set(realUserNameAtom, name.value)
    if (photo) set(realUserImageAtom, {type: 'imageUri', imageUri: photo})

    const {identity, contact} = revealFromSelection({
      selection,
      requested: get(requestedDetailsAtom),
      name: Option.getOrUndefined(name),
      photo,
      phoneNumber: get(exchangeDetailsPhoneNumberAtom),
      timestamp: unixMillisecondsNow(),
    })

    set(
      updatesToBeSentAtom,
      ({identity: _identity, contact: _contact, ...updates}) => ({
        ...updates,
        ...(identity ? {identity} : {}),
        ...(contact ? {contact} : {}),
      })
    )
    set(discardExchangeDetailsDraftActionAtom)

    return true
  }
)

export const declineExchangeDetailsActionAtom = atom(null, (get, set) => {
  const requested = get(requestedDetailsAtom)
  const timestamp = unixMillisecondsNow()

  set(updatesToBeSentAtom, (updates) => ({
    ...updates,
    ...(requested.nickname || requested.photo
      ? {identity: {status: 'DISAPPROVE_REVEAL', timestamp}}
      : {}),
    ...(requested.phoneNumber
      ? {contact: {status: 'DISAPPROVE_REVEAL', timestamp}}
      : {}),
  }))

  return set(submitTradeChecklistUpdatesActionAtom)
})
