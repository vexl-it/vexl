import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Schema} from 'effect'
import {createStore} from 'jotai'
import {
  realUserImageAtom,
  realUserNameAtom,
} from '../../../state/session/userDataAtoms'
import {type IdentityRevealStatus} from '../../../state/tradeChecklist/utils/getIdentityRevealStatus'
import {
  discardRevealIdentityDraftActionAtom,
  initializeEmptyRevealIdentityDraftFromProfileActionAtom,
  revealIdentityImageUriAtom,
  revealIdentityUsernameAtom,
} from './revealIdentityAtoms'
import {revealIdentityFlowTypeFromStatus} from './revealIdentityFlowType'

jest.mock('../../../components/GlobalDialog', () => {
  const {atom: createAtom} = jest.requireActual('jotai')

  return {
    askAreYouSureActionAtom: createAtom(null, () => undefined),
  }
})

jest.mock('../../../utils/preferences', () => {
  const {atom: createAtom} = jest.requireActual('jotai')

  return {
    goldenAvatarTypeAtom: createAtom(undefined),
  }
})

jest.mock('../../../state/session', () => {
  const {atom: createAtom} = jest.requireActual('jotai')

  return {
    sessionDataOrDummyAtom: createAtom({
      phoneNumber: '+420123456789',
      realUserData: {},
    }),
  }
})

jest.mock('../../../state/tradeChecklist/atoms/fromChatAtoms', () => {
  const {atom: createAtom} = jest.requireActual('jotai')

  return {
    chatWithMessagesAtom: createAtom({
      messages: [],
    }),
    tradeChecklistDataAtom: createAtom({
      contact: {},
    }),
  }
})

jest.mock('./updatesToBeSentAtom', () => {
  const {atom: createAtom} = jest.requireActual('jotai')

  return {
    __esModule: true,
    default: createAtom({}),
  }
})

const requestFlowStatuses: readonly IdentityRevealStatus[] = [
  'notStarted',
  'iAsked',
  'denied',
  'shared',
]

it('responds to a newer incoming identity request even after an older sent request was denied', () => {
  expect(revealIdentityFlowTypeFromStatus('theyAsked')).toBe('RESPOND_REVEAL')
})

it.each(requestFlowStatuses)(
  'starts a request for %s identity reveal status',
  (status) => {
    expect(revealIdentityFlowTypeFromStatus(status)).toBe('REQUEST_REVEAL')
  }
)

it('does not restore profile defaults after the reveal identity draft is explicitly cleared', () => {
  const store = createStore()
  const realUserName = Schema.decodeUnknownSync(UserName)('Alice')
  const realUserImageUri = Schema.decodeUnknownSync(UriString)(
    'file:///profile-image.jpg'
  )

  store.set(realUserNameAtom, realUserName)
  store.set(realUserImageAtom, {
    type: 'imageUri',
    imageUri: realUserImageUri,
  })

  store.set(initializeEmptyRevealIdentityDraftFromProfileActionAtom)

  expect(store.get(revealIdentityUsernameAtom)).toBe(realUserName)
  expect(store.get(revealIdentityImageUriAtom)).toBe(realUserImageUri)

  store.set(revealIdentityUsernameAtom, '')
  store.set(revealIdentityImageUriAtom, undefined)
  store.set(initializeEmptyRevealIdentityDraftFromProfileActionAtom)

  expect(store.get(revealIdentityUsernameAtom)).toBe('')
  expect(store.get(revealIdentityImageUriAtom)).toBeUndefined()

  store.set(discardRevealIdentityDraftActionAtom)
  store.set(initializeEmptyRevealIdentityDraftFromProfileActionAtom)

  expect(store.get(revealIdentityUsernameAtom)).toBe(realUserName)
  expect(store.get(revealIdentityImageUriAtom)).toBe(realUserImageUri)
})
