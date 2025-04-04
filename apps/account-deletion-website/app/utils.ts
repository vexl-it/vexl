import {ecdsa} from '@vexl-next/cryptography'
import {
  PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {SemverStringE} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  parseJson,
  safeParse,
  stringifyToJson,
  type JsonParseError,
  type JsonStringifyError,
  type ZodParseError,
} from '@vexl-next/resources-utils/src/utils/parsing'
import {ENV_PRESETS, type EnvPreset} from '@vexl-next/rest-api'
import * as contactsApi from '@vexl-next/rest-api/src/services/contact'
import * as userApi from '@vexl-next/rest-api/src/services/user'
import {Effect, Schema} from 'effect'
import * as E from 'fp-ts/lib/Either'
import {pipe} from 'fp-ts/lib/function'

const STORAGE_KEYPAIR_KEY = 'keypair'

const apiMeta = {
  clientVersion: Schema.decodeSync(VersionCode)(0),
  clientSemver: Schema.decodeSync(SemverStringE)('0.0.1'),
  platform: 'WEB' as const,
  language: 'en',
  isDeveloper: false,
  appSource: 'account-deletion-page' as const,
}

export function saveKeypair(keypair: PrivateKeyHolder): void {
  sessionStorage.setItem(STORAGE_KEYPAIR_KEY, JSON.stringify(keypair))
}

interface NoKeypairStored {
  _tag: 'NoKeypairStored'
}
interface ErrorGettingKeypair {
  _tag: 'ErrorGettingKeypair'
}
export function getKeypair(): E.Either<
  | ErrorGettingKeypair
  | NoKeypairStored
  | ZodParseError<PrivateKeyHolder>
  | JsonParseError,
  PrivateKeyHolder
> {
  return pipe(
    E.tryCatch(
      () => sessionStorage.getItem(STORAGE_KEYPAIR_KEY),
      () => ({_tag: 'ErrorGettingKeypair'}) as const
    ),
    E.chainW(E.fromNullable({_tag: 'NoKeypairStored'} as const)),
    E.chainW(parseJson),
    E.chainW(safeParse(PrivateKeyHolder))
  )
}

interface ErrorSavingKeypair {
  _tag: 'ErrorSavingKeypair'
}
export function saveKeyPair(
  keypair: PrivateKeyHolder
): E.Either<ErrorSavingKeypair | JsonStringifyError, void> {
  return pipe(
    stringifyToJson(keypair),
    E.chainW(() =>
      E.tryCatch(
        () => {
          sessionStorage.setItem(STORAGE_KEYPAIR_KEY, JSON.stringify(keypair))
        },
        () => ({_tag: 'ErrorSavingKeypair'}) as const
      )
    )
  )
}

interface ErrorSigning {
  _tag: 'ErrorSigning'
}
export function ecdsaSign(
  keypair: PrivateKeyHolder
): (challenge: string) => E.Either<ErrorSigning, string> {
  return (challenge: string) =>
    E.tryCatch(
      () =>
        ecdsa.ecdsaSign({
          privateKey: keypair.privateKeyPemBase64,
          challenge,
        }),
      () => ({_tag: 'ErrorSigning'}) as const
    )
}

function getEnvPreset(): EnvPreset {
  const isProd = process.env.BE_ENV === 'prod'
  return ENV_PRESETS[isProd ? 'prodEnv' : 'stageEnv']
}

interface ErrorParsingFormData {
  _tag: 'ErrorParsingFormData'
}

export function parseFormData<T extends Schema.Schema<any>>(
  schemaType: T
): (
  request: Request
) => Effect.Effect<Schema.Schema.Type<T>, ErrorParsingFormData, never> {
  return (request: Request) =>
    Effect.tryPromise({
      try: async () => {
        const formData = await request.formData()
        const object = Object.fromEntries(formData)
        return Schema.decodeSync(schemaType)(object)
      },
      catch: (e) => ({_tag: 'ErrorParsingFormData'}),
    })
}

export function createUserPublicApi(): userApi.UserApi {
  return userApi.api({
    url: getEnvPreset().userMs,
    ...apiMeta,
  })
}

export function createContactsPrivateApi({
  hash,
  publicKey,
  signature,
}: {
  hash: string
  publicKey: PublicKeyPemBase64
  signature: string
}): contactsApi.ContactApi {
  return contactsApi.api({
    getUserSessionCredentials: () => ({
      hash,
      publicKey,
      signature,
    }),
    url: getEnvPreset().contactMs,
    ...apiMeta,
  })
}

export function createUserPrivateApi({
  hash,
  publicKey,
  signature,
}: {
  hash: string
  publicKey: PublicKeyPemBase64
  signature: string
}): userApi.UserApi {
  return userApi.api({
    getUserSessionCredentials: () => ({
      hash,
      publicKey,
      signature,
    }),
    url: getEnvPreset().userMs,
    ...apiMeta,
  })
}
