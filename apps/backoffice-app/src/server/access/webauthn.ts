import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import {Config, type ConfigError, Effect, Schema} from 'effect'
import {backofficeOriginConfig} from '../config'
import {accessError, type AccessRequestError} from './errors'
import {type Credential, type StoredCredential} from './repository'

const relyingPartyConfig = backofficeOriginConfig.pipe(
  Config.map((url) => ({origin: url.origin, rpID: url.hostname}))
)

const AuthenticatorAttachment = Schema.optional(
  Schema.Literal('platform', 'cross-platform')
)

// Extension results are not used, so they are dropped while decoding.
const NoExtensionResults = Schema.Struct({})

export const RegistrationResponse = Schema.Struct({
  id: Schema.String,
  rawId: Schema.String,
  type: Schema.Literal('public-key'),
  authenticatorAttachment: AuthenticatorAttachment,
  clientExtensionResults: NoExtensionResults,
  response: Schema.Struct({
    clientDataJSON: Schema.String,
    attestationObject: Schema.String,
    authenticatorData: Schema.optional(Schema.String),
    transports: Schema.optional(Schema.mutable(Schema.Array(Schema.String))),
    publicKeyAlgorithm: Schema.optional(Schema.Number),
    publicKey: Schema.optional(Schema.String),
  }),
})
export type RegistrationResponse = typeof RegistrationResponse.Type

export const AuthenticationResponse = Schema.Struct({
  id: Schema.String,
  rawId: Schema.String,
  type: Schema.Literal('public-key'),
  authenticatorAttachment: AuthenticatorAttachment,
  clientExtensionResults: NoExtensionResults,
  response: Schema.Struct({
    clientDataJSON: Schema.String,
    authenticatorData: Schema.String,
    signature: Schema.String,
    userHandle: Schema.optional(Schema.String),
  }),
})
export type AuthenticationResponse = typeof AuthenticationResponse.Type

const verificationFailed = (): AccessRequestError =>
  accessError(400, 'The passkey could not be verified')

export const makeRegistrationOptions = (
  label: string
): Effect.Effect<
  PublicKeyCredentialCreationOptionsJSON,
  ConfigError.ConfigError
> =>
  Effect.flatMap(relyingPartyConfig, ({rpID}) =>
    Effect.promise(() =>
      generateRegistrationOptions({
        rpName: 'Vexl Backoffice',
        rpID,
        userName: label,
        userDisplayName: label,
        attestationType: 'none',
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required',
        },
      })
    )
  )

export const verifyRegistration = (
  response: RegistrationResponse,
  expectedChallenge: string
): Effect.Effect<Credential, AccessRequestError | ConfigError.ConfigError> =>
  Effect.gen(function* (_) {
    const {origin, rpID} = yield* _(relyingPartyConfig)
    const verification = yield* _(
      Effect.tryPromise({
        try: () =>
          verifyRegistrationResponse({
            response,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            requireUserVerification: true,
          }),
        catch: verificationFailed,
      })
    )
    if (!verification.verified) return yield* _(verificationFailed())

    const {credential} = verification.registrationInfo
    return {
      id: credential.id,
      publicKey: credential.publicKey,
      counter: credential.counter,
      transports: credential.transports ?? [],
    }
  })

export const makeAuthenticationOptions: Effect.Effect<
  PublicKeyCredentialRequestOptionsJSON,
  ConfigError.ConfigError
> = Effect.flatMap(relyingPartyConfig, ({rpID}) =>
  Effect.promise(() =>
    generateAuthenticationOptions({rpID, userVerification: 'required'})
  )
)

/** Returns the authenticator's new signature counter. */
export const verifyAuthentication = (
  response: AuthenticationResponse,
  expectedChallenge: string,
  credential: StoredCredential
): Effect.Effect<number, AccessRequestError | ConfigError.ConfigError> =>
  Effect.gen(function* (_) {
    const {origin, rpID} = yield* _(relyingPartyConfig)
    const verification = yield* _(
      Effect.tryPromise({
        try: () =>
          verifyAuthenticationResponse({
            response,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            credential: {
              id: credential.id,
              publicKey: new Uint8Array(credential.publicKey),
              counter: credential.counter,
              transports: [...credential.transports],
            },
            requireUserVerification: true,
          }),
        catch: verificationFailed,
      })
    )
    if (!verification.verified) return yield* _(verificationFailed())

    return verification.authenticationInfo.newCounter
  })
