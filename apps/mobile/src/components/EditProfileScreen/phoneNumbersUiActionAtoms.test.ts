import {Effect} from 'effect'
import {createStore} from 'jotai'
import {makeExtraPhoneNumber} from '../../state/session/extraPhoneNumber.testUtils'
import {
  addVerifiedPhoneNumberWithUiFeedbackActionAtom,
  removePhoneNumberWithUiFeedbackActionAtom,
} from './phoneNumbersUiActionAtoms'

const mockShowDialog = jest.fn<Effect.Effect<boolean>, [unknown]>(() =>
  Effect.succeed(true)
)
const mockAdd = jest.fn((_: unknown) => Effect.void)
const mockDiscard = jest.fn((_: unknown) => Effect.void)
const mockRemove = jest.fn(
  (_: unknown): Effect.Effect<void, {readonly _tag: string}> => Effect.void
)
const mockReportError = jest.fn()

jest.mock('../GlobalDialog', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    globalDialogAtom: atom(null, (_: unknown, __: unknown, args: unknown) =>
      mockShowDialog(args)
    ),
  }
})
jest.mock('../LoadingOverlayProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    withLoadingOverlayAtom: atom(null, () => (effect: unknown) => effect),
  }
})
jest.mock('../../utils/localization/I18nProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {translationAtom: atom({t: (key: string) => key})}
})
jest.mock('../../utils/reportError', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockReportError(...args),
}))
jest.mock('../../state/phoneNumbers/addPhoneNumberActionAtoms', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    addVerifiedPhoneNumberActionAtom: atom(
      null,
      (_: unknown, __: unknown, verified: unknown) => mockAdd(verified)
    ),
    discardVerifiedPhoneNumberActionAtom: atom(
      null,
      (_: unknown, __: unknown, verified: unknown) => mockDiscard(verified)
    ),
  }
})
jest.mock('../../state/phoneNumbers/removePhoneNumberActionAtom', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    removePhoneNumberActionAtom: atom(
      null,
      (_: unknown, __: unknown, phoneNumber: unknown) => mockRemove(phoneNumber)
    ),
  }
})

const verified = {
  ...makeExtraPhoneNumber({
    phoneNumber: '+420777777777',
    hash: 'new-hash',
    index: 0,
  }),
  hasExistingVexlAccount: true,
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('addVerifiedPhoneNumberWithUiFeedbackActionAtom', () => {
  it('discards the verified number when the user cancels the takeover warning', async () => {
    mockShowDialog.mockReturnValueOnce(Effect.succeed(false))

    await Effect.runPromise(
      createStore().set(
        addVerifiedPhoneNumberWithUiFeedbackActionAtom,
        verified
      )
    )

    expect(mockAdd).not.toHaveBeenCalled()
    expect(mockDiscard).toHaveBeenCalledWith(verified)
  })

  it('adds the number when the user confirms', async () => {
    await Effect.runPromise(
      createStore().set(
        addVerifiedPhoneNumberWithUiFeedbackActionAtom,
        verified
      )
    )

    expect(mockAdd).toHaveBeenCalledWith(verified)
    expect(mockDiscard).not.toHaveBeenCalled()
  })
})

describe('removePhoneNumberWithUiFeedbackActionAtom', () => {
  it('explains instead of reporting when the main number is to be removed', async () => {
    mockRemove.mockReturnValueOnce(
      Effect.fail({_tag: 'CannotRemoveMainPhoneNumberError'})
    )

    await Effect.runPromise(
      createStore().set(
        removePhoneNumberWithUiFeedbackActionAtom,
        verified.phoneNumber
      )
    )

    expect(mockShowDialog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        subtitle: 'editProfileScreen.phoneNumbers.mainCannotBeRemoved',
      })
    )
    expect(mockReportError).not.toHaveBeenCalled()
  })
})
