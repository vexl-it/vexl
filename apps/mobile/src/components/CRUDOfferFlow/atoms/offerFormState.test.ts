import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {JSDateString} from '@vexl-next/domain/src/utility/JSDateString.brand'
import {Schema} from 'effect'
import {
  copyOfferFieldGroup,
  createInitialOfferFormState,
  mergeOfferFormStateIntoPublicPart,
  offerFormStateToNewOfferPublicPart,
  type OfferFormState,
} from './offerFormState'

jest.mock('../../../utils/getDefaultCurrency', () => ({
  __esModule: true,
  default: (): string => 'CZK',
}))
jest.mock('../../../utils/localization/getDefaultSpokenLanguage', () => ({
  __esModule: true,
  default: (): readonly string[] => ['ENG'],
}))
jest.mock('../../../utils/preferences', () => {
  const {atom} = jest.requireActual('jotai')
  return {currentAppLanguageAtom: atom('en')}
})

const originalExpirationDate = Schema.decodeSync(JSDateString)('2026-09-01')
const updatedExpirationDate = Schema.decodeSync(JSDateString)('2026-10-01')
const offerPublicKey = Schema.decodeSync(PublicKeyPemBase64)('publicKey')

const committedForm: OfferFormState = {
  ...createInitialOfferFormState(),
  feeAmount: 0,
  expirationDate: originalExpirationDate,
  intendedConnectionLevel: 'FIRST',
}

const workingForm: OfferFormState = {
  ...committedForm,
  feeAmount: 5,
  expirationDate: updatedExpirationDate,
  intendedConnectionLevel: 'ALL',
}

describe('copyOfferFieldGroup', () => {
  it('keeps expiration unchanged when saving the amount field', () => {
    const result = copyOfferFieldGroup('amount', workingForm, committedForm)

    expect(result.feeAmount).toBe(5)
    expect(result.expirationDate).toBe(originalExpirationDate)
  })

  it('saves expiration with the friend level field', () => {
    const result = copyOfferFieldGroup(
      'friendLevel',
      workingForm,
      committedForm
    )

    expect(result.feeAmount).toBe(0)
    expect(result.expirationDate).toBe(updatedExpirationDate)
    expect(result.intendedConnectionLevel).toBe('ALL')
  })

  it('removes expiration from an updated offer after it is cleared', () => {
    const clearedWorkingForm: OfferFormState = {
      ...workingForm,
      expirationDate: undefined,
    }
    const savedForm = copyOfferFieldGroup(
      'friendLevel',
      clearedWorkingForm,
      committedForm
    )
    const originalPublicPart = offerFormStateToNewOfferPublicPart({
      state: committedForm,
      offerPublicKey,
    })

    const result = mergeOfferFormStateIntoPublicPart(
      savedForm,
      originalPublicPart
    )

    expect(result).not.toHaveProperty('expirationDate')
  })

  it('omits a cleared expiration from a new offer', () => {
    const clearedWorkingForm: OfferFormState = {
      ...workingForm,
      expirationDate: undefined,
    }

    const result = offerFormStateToNewOfferPublicPart({
      state: clearedWorkingForm,
      offerPublicKey,
    })

    expect(result).not.toHaveProperty('expirationDate')
  })
})
