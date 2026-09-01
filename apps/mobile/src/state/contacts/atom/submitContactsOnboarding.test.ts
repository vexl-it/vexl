/**
 * Regression tests for the onboarding contact import flow (fresh device).
 * Runs the REAL pipeline - loadContactsFromDevice -> normalize -> plan ->
 * import -> update imported flags -> persist - with only device IO, network
 * and UI mocked.
 */
import {Effect} from 'effect'
import {createStore} from 'jotai'

jest.mock('react-native-mmkv')

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}))

jest.mock('expo-file-system', () => ({
  Paths: {document: '/mock/documents'},
  File: jest.fn().mockImplementation(() => ({exists: false, size: 0})),
}))

jest.mock('../../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('expo-contacts', () => ({
  getPermissionsAsync: jest.fn(async () => ({
    granted: true,
    canAskAgain: true,
    accessPrivileges: 'all',
  })),
  requestPermissionsAsync: jest.fn(async () => ({
    granted: true,
    canAskAgain: true,
    accessPrivileges: 'all',
  })),
}))

const mockDeviceContactsState = {count: 42}

jest.mock('../getDeviceContactsFromSystem', () => ({
  getDeviceContactsFromSystem: jest.fn(async () =>
    Array.from({length: mockDeviceContactsState.count}, (_, i) => ({
      id: `contact-${i}`,
      firstName: `First${i}`,
      lastName: `Last${i}`,
      name: `First${i} Last${i}`,
      phoneNumbers: [
        {label: 'mobile', number: `+420601${String(100 + i).padStart(6, '0')}`},
      ],
    }))
  ),
}))

jest.mock('../../../utils/localization/I18nProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    __esModule: true,
    translationAtom: atom({t: (key: string) => key}),
    useTranslation: () => ({t: (key: string) => key}),
  }
})

jest.mock('../../../utils/localization/formatting', () => ({
  formatInteger: (n: number) => String(n),
}))

jest.mock('../../../utils/localization/formattingLocaleAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {formattingLocaleAtom: atom('en-US')}
})

jest.mock('../../../utils/toE164PhoneNumberWithDefaultCountryCode', () => {
  const {toE164PhoneNumber} = jest.requireActual(
    '@vexl-next/domain/src/general/E164PhoneNumber.brand'
  )
  return {
    __esModule: true,
    default: (number: string) => toE164PhoneNumber(number, 'CZ'),
  }
})

jest.mock('../../../utils/useCommonErrorMessages', () => ({
  toCommonErrorMessage: () => 'common error',
}))

// Flip to true to emulate real frame pacing (16ms) instead of resolving
// synchronously - lets other timers (MMKV idle flushes, concurrent effects)
// interleave with the pipeline the way they do on a device.
const mockFrameState = {realistic: false}

jest.mock('../../../utils/runAfterAnimationFrames', () => {
  const {Effect} = jest.requireActual('effect')
  const wait = async (): Promise<void> => {
    if (mockFrameState.realistic) {
      await new Promise((resolve) => setTimeout(resolve, 16))
    }
  }
  return {
    waitForNextAnimationFrameEffect: () => Effect.promise(wait),
    waitForNextAnimationFramePromise: wait,
    runAfterTwoAnimationFrames: (fn: () => void) => {
      void wait().then(fn)
    },
  }
})

jest.mock('../../../components/LoadingOverlayProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {loadingOverlayDisplayedAtom: atom(false)}
})

jest.mock('../../../components/UploadingOfferProgressModal/atoms', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    offerProgressModalActionAtoms: {
      show: atom(null, () => {}),
      showStep: atom(null, () => {}),
      hide: atom(null, () => {}),
      hideDeffered: atom(null, () => Effect.void),
    },
    waitUntilProgressModalIsFullyHiddenActionAtom: atom(
      null,
      () => Effect.void
    ),
  }
})

jest.mock('../../connections/atom/connectionStateAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {syncConnectionsActionAtom: atom(null, () => Effect.void)}
})

jest.mock('../../connections/atom/noteToConnectionsAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    noteRecordsToReencryptCountAtom: atom(0),
    updateAndReencryptAllNotesConnectionsActionAtom: atom(
      null,
      () => Effect.void
    ),
  }
})

jest.mock('../../connections/atom/offerToConnectionsAtom', () => {
  const {atom} = jest.requireActual('jotai')
  const {Effect} = jest.requireActual('effect')
  return {
    offersToReencryptCountAtom: atom(0),
    updateAndReencryptAllOffersConnectionsActionAtom: atom(
      null,
      () => Effect.void
    ),
  }
})

jest.mock(
  '../../connections/atom/reachNumberWithoutClubsConnectionsMmkvAtom',
  () => {
    const {atom} = jest.requireActual('jotai')
    return {
      updatePersistentDataAboutNumberOfImportedContactsActionAtom: atom(
        null,
        () => {}
      ),
      updatePersistentDataAboutReachActionAtom: atom(null, () => {}),
    }
  }
)

jest.mock('../../marketplace/atoms/myOffers', () => {
  const {atom} = jest.requireActual('jotai')
  return {areThereAnyMyOffersAtom: atom(false)}
})

jest.mock('../../notes/atoms/notesState', () => {
  const {atom} = jest.requireActual('jotai')
  return {areThereAnyMyNotesAtom: atom(false)}
})

const mockImportContacts = jest.fn(
  (request: {contacts: readonly string[]; replace: boolean}) => {
    const {Effect} = jest.requireActual('effect')
    return Effect.succeed({
      imported: true,
      message: 'ok',
      phoneNumberHashesToServerToClientHash: request.contacts.map((hash) => ({
        hashedNumber: hash,
        serverToClientHash: `ServerToClientHash:${hash}`,
      })),
    })
  }
)

jest.mock('../../../api', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    apiAtom: atom({
      contact: {
        importContacts: (request: {
          contacts: readonly string[]
          replace: boolean
        }) => mockImportContacts(request),
      },
    }),
  }
})

// eslint-disable-next-line import/first
import {importedContactsCountAtom, storedContactsAtom} from './contactsStore'
// eslint-disable-next-line import/first
import loadAndNormalizeContactsFromDeviceActionAtom from './loadAndNormalizeContactsFromDeviceActionAtom'
// eslint-disable-next-line import/first
import {submitContactsActionAtom} from './submitContactsActionAtom'

const onboardingSubmitParams = {
  normalizeAndImportAll: true,
  showOfferReencryptionDialog: false,
  showContactImportProgressDialog: true,
  manageLoadingOverlay: false,
} as const

describe('Onboarding contact import (fresh device)', () => {
  beforeEach(() => {
    // The MMKV mock is module-scoped - clear it so persisted state from one
    // test cannot leak into the next via the atom's on-mount re-decode.
    const {storage} = jest.requireActual('../../../utils/mmkv/effectMmkv')
    storage._storage.clearAll()
  })

  it('imports all device contacts, marks them imported and persists them', async () => {
    mockDeviceContactsState.count = 42
    const store = createStore()

    const result = await Effect.runPromise(
      store.set(submitContactsActionAtom, onboardingSubmitParams)
    )

    expect(result).toEqual('success')
    expect(store.get(storedContactsAtom).length).toEqual(42)
    expect(store.get(importedContactsCountAtom)).toEqual(42)

    // Flush deferred MMKV writes and verify the imported flags actually
    // persisted - in-memory state surviving is not enough, a restart must
    // not lose them.
    const {flushAllScheduledMmkvWrites} = jest.requireActual(
      '../../../utils/atomUtils/atomWithParsedMmkvStorage'
    )
    flushAllScheduledMmkvWrites()
    const {storage} = jest.requireActual('../../../utils/mmkv/effectMmkv')
    const persisted = storage._storage.getString('storedContacts')
    expect(persisted).toBeDefined()
    expect(
      JSON.parse(persisted).contacts.filter(
        (contact: {flags: {imported: boolean}}) => contact.flags.imported
      ).length
    ).toEqual(42)
  })

  it('imports with realistic frame timing, mounted atoms and a concurrent resume-task load', async () => {
    mockFrameState.realistic = true
    mockDeviceContactsState.count = 1500
    mockImportContacts.mockClear()

    const {getDefaultStore} = jest.requireActual('jotai')
    const store = getDefaultStore()

    // RootNavigation keeps importedContactsCountAtom mounted the whole time
    const unsub = store.sub(importedContactsCountAtom, () => {})

    const submitPromise = Effect.runPromise(
      store.set(submitContactsActionAtom, onboardingSubmitParams)
    )

    // Granting the OS contacts permission flips app state inactive -> active,
    // which fires the resume in-app loading task that also loads contacts.
    await new Promise((resolve) => setTimeout(resolve, 30))
    const resumeTaskPromise = Effect.runPromise(
      store.set(loadAndNormalizeContactsFromDeviceActionAtom)
    )

    const result = await submitPromise
    await resumeTaskPromise
    unsub()

    expect(result).toEqual('success')
    expect(store.get(storedContactsAtom).length).toEqual(1500)
    expect(store.get(importedContactsCountAtom)).toEqual(1500)
    // Two chunks of CONTACT_IMPORT_BATCH_SIZE, both incremental
    expect(
      mockImportContacts.mock.calls.map(([request]) => ({
        replace: request.replace,
        count: request.contacts.length,
      }))
    ).toEqual([
      {replace: false, count: 1000},
      {replace: false, count: 500},
    ])
  })

  it('imports even when stored contact objects are replaced mid-normalization', async () => {
    mockFrameState.realistic = true
    mockDeviceContactsState.count = 800
    mockImportContacts.mockClear()

    const store = createStore()
    const submitPromise = Effect.runPromise(
      store.set(submitContactsActionAtom, onboardingSubmitParams)
    )

    // react-native-mmkv v4 delivers change notifications asynchronously; the
    // storage atom used to re-decode the persisted blob in response,
    // replacing every stored contact object with an equal-content copy while
    // normalization was still running. Simulate that identity churn.
    for (let i = 0; i < 8; i++) {
      await new Promise((resolve) => setTimeout(resolve, 40))
      store.set(storedContactsAtom, (prev) =>
        prev.map((contact) => ({
          ...contact,
          info: {...contact.info},
          flags: {...contact.flags},
        }))
      )
    }

    const result = await submitPromise
    expect(result).toEqual('success')
    expect(store.get(importedContactsCountAtom)).toEqual(800)
  })

  it('reports noContactsSelected without calling the server when the device returns no contacts', async () => {
    mockFrameState.realistic = false
    mockDeviceContactsState.count = 0
    mockImportContacts.mockClear()

    const store = createStore()
    const result = await Effect.runPromise(
      store.set(submitContactsActionAtom, onboardingSubmitParams)
    )

    // This outcome MUST be surfaced by the onboarding screen (see
    // showNoContactsFoundExplanationActionAtom) - it is what a user with iOS
    // limited contacts access and no selected contacts gets after granting
    // the permission.
    expect(result).toEqual('noContactsSelected')
    expect(store.get(importedContactsCountAtom)).toEqual(0)
    expect(mockImportContacts).not.toHaveBeenCalled()
  })
})
