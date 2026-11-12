import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  type InitPhoneVerificationResponse,
  type PhoneNumberVerificationId,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Array, Effect, Option, Schema, Struct} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../api'
import {contactApiForPhoneNumber} from '../../api/contactApiForSession'
import {
  type ExtraSessionPhoneNumber,
  type SessionV2,
} from '../../brands/Session.brand'
import {initPhoneVerificationAtom} from '../../components/LoginFlow/api/initPhoneVerificationAtom'
import {verifyPhoneNumberAtom} from '../../components/LoginFlow/api/verifyPhoneNumberAtom'
import {
  importedContactsAtom,
  needsFullContactsReplaceAfterContactEditAtom,
} from '../contacts/atom/contactsStore'
import {
  submitContactsActionAtom,
  type SubmitContactsResult,
} from '../contacts/atom/submitContactsActionAtom'
import {createPhoneNumberKeysActionAtom} from '../keyDerivation'
import {sessionDataOrDummyAtom} from '../session'
import {loginSessionWithProof} from '../session/loginSession'
import {
  addPhoneNumberToSession,
  PhoneNumberAlreadyInAccountError,
  sessionHasPhoneNumber,
} from '../session/sessionPhoneNumbers'
import {upgradeSessionCredentials} from '../session/upgradeSession'
import {verifyLoginChallenge} from '../session/verifyLoginChallenge'

// `message` is translated and ready to show
export class SendVerificationSmsError extends Schema.TaggedError<SendVerificationSmsError>(
  'SendVerificationSmsError'
)('SendVerificationSmsError', {message: Schema.String}) {}

// `message` is translated and ready to show
export class VerificationCodeError extends Schema.TaggedError<VerificationCodeError>(
  'VerificationCodeError'
)('VerificationCodeError', {message: Schema.String}) {}

export class VerifyPhoneNumberToAddError extends Schema.TaggedError<VerifyPhoneNumberToAddError>(
  'VerifyPhoneNumberToAddError'
)('VerifyPhoneNumberToAddError', {cause: Schema.Unknown}) {}

export class CreateUserForPhoneNumberError extends Schema.TaggedError<CreateUserForPhoneNumberError>(
  'CreateUserForPhoneNumberError'
)('CreateUserForPhoneNumberError', {cause: Schema.Unknown}) {}

export interface VerifiedPhoneNumber extends ExtraSessionPhoneNumber {
  // Adding the number replaces that account, warn the user first
  readonly hasExistingVexlAccount: boolean
}

const ensureNotInAccount = (
  session: SessionV2,
  phoneNumber: E164PhoneNumber
): Effect.Effect<void, PhoneNumberAlreadyInAccountError> =>
  sessionHasPhoneNumber(session, phoneNumber)
    ? Effect.fail(new PhoneNumberAlreadyInAccountError())
    : Effect.void

/**
 * Step 1 of adding a phone number: sends the verification SMS.
 */
export const startPhoneNumberVerificationActionAtom = atom(
  null,
  (
    get,
    set,
    phoneNumber: E164PhoneNumber
  ): Effect.Effect<
    InitPhoneVerificationResponse,
    PhoneNumberAlreadyInAccountError | SendVerificationSmsError
  > =>
    ensureNotInAccount(get(sessionDataOrDummyAtom), phoneNumber).pipe(
      Effect.andThen(() =>
        set(initPhoneVerificationAtom, phoneNumber).pipe(
          Effect.mapError((message) => new SendVerificationSmsError({message}))
        )
      )
    )
)

/**
 * Step 2 of adding a phone number: derives a new key pair for the number,
 * verifies the SMS code with it and gets credentials for the number. Nothing
 * is stored in the session yet. Every attempt uses a new key, an index whose
 * key may have reached user-service is never handed out again.
 */
export const verifyPhoneNumberToAddActionAtom = atom(
  null,
  (
    get,
    set,
    {
      phoneNumber,
      verificationId,
      code,
    }: {
      phoneNumber: E164PhoneNumber
      verificationId: PhoneNumberVerificationId
      code: string
    }
  ): Effect.Effect<
    VerifiedPhoneNumber,
    | PhoneNumberAlreadyInAccountError
    | VerificationCodeError
    | VerifyPhoneNumberToAddError
  > =>
    Effect.gen(function* (_) {
      yield* _(ensureNotInAccount(get(sessionDataOrDummyAtom), phoneNumber))

      const keys = yield* _(
        set(createPhoneNumberKeysActionAtom),
        Effect.mapError((cause) => new VerifyPhoneNumberToAddError({cause}))
      )

      const {challenge} = yield* _(
        set(verifyPhoneNumberAtom, {
          code,
          id: verificationId,
          userPublicKey: keys.privateKey.publicKeyPemBase64,
        }),
        Effect.mapError((message) => new VerificationCodeError({message}))
      )

      return yield* _(
        verifyLoginChallenge({
          userApi: get(apiAtom).user,
          privateKey: keys.privateKey,
          challenge,
        }),
        Effect.flatMap((credentials) =>
          upgradeSessionCredentials(credentials, keys.keyPairV2)
        ),
        Effect.flatMap((sessionCredentials) => {
          const verified = {...keys, phoneNumber, sessionCredentials}
          return contactApiForPhoneNumber(get, verified)
            .checkUserExists({notifyExistingUserAboutLogin: true})
            .pipe(
              Effect.map(({exists}) => ({
                ...verified,
                hasExistingVexlAccount: exists,
              }))
            )
        }),
        Effect.mapError((cause) => new VerifyPhoneNumberToAddError({cause}))
      )
    })
)

/**
 * Step 3 of adding a phone number, after the user confirmed: registers the
 * number on contact-service (replacing an account it may have), stores it in
 * the session and imports contacts under it. The number stays added when the
 * import fails, the next import catches up.
 */
export const addVerifiedPhoneNumberActionAtom = atom(
  null,
  (
    get,
    set,
    verified: ExtraSessionPhoneNumber
  ): Effect.Effect<
    SubmitContactsResult,
    PhoneNumberAlreadyInAccountError | CreateUserForPhoneNumberError
  > =>
    Effect.gen(function* (_) {
      const session = get(sessionDataOrDummyAtom)
      yield* _(ensureNotInAccount(session, verified.phoneNumber))

      yield* _(
        loginSessionWithProof({
          loginSessionId: session.loginSessionId,
          privateKey: verified.privateKey,
        }),
        Effect.flatMap((loginSession) =>
          contactApiForPhoneNumber(get, verified).createUser({
            publicKeyV2: Option.none(),
            // Only the main number gets pushes
            vexlNotificationToken: Option.none(),
            ...loginSession,
          })
        ),
        Effect.mapError((cause) => new CreateUserForPhoneNumberError({cause}))
      )

      set(
        sessionDataOrDummyAtom,
        yield* _(
          addPhoneNumberToSession(
            get(sessionDataOrDummyAtom),
            Struct.pick(
              verified,
              'phoneNumber',
              'sessionCredentials',
              'privateKey',
              'keyPairV2',
              'keyDerivationIndex'
            )
          )
        )
      )
      // The new number has no contacts on contact-service yet
      set(needsFullContactsReplaceAfterContactEditAtom, true)

      return yield* _(
        set(submitContactsActionAtom, {
          normalizeAndImportAll: false,
          numbersToImport: Array.map(
            get(importedContactsAtom),
            (one) => one.computedValues.normalizedNumber
          ),
          showOfferReencryptionDialog: true,
          showContactImportProgressDialog: true,
        })
      )
    })
)
