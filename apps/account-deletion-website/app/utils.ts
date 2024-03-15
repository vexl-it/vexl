import {ecdsa} from '@vexl-next/cryptography'
import {
  PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
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
import * as E from 'fp-ts/lib/Either'
import * as TE from 'fp-ts/lib/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import type z from 'zod'

const STORAGE_KEYPAIR_KEY = 'keypair'

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
          privateKey: keypair,
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

export function parseFormData<T extends z.ZodType>(
  zodType: T
): (request: Request) => TE.TaskEither<ErrorParsingFormData, z.TypeOf<T>> {
  return (request: Request) =>
    TE.tryCatch(
      async () => {
        const formData = await request.formData()
        const object = Object.fromEntries(formData)
        return zodType.parse(object)
      },
      (e) => ({
        _tag: 'ErrorParsingFormData',
      })
    )
}

export function createUserPublicApi(): userApi.UserPublicApi {
  return userApi.publicApi({
    url: getEnvPreset().userMs,
    clientVersion: 1,
    platform: 'WEB',
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
}): contactsApi.ContactPrivateApi {
  return contactsApi.privateApi({
    clientVersion: 1,
    getUserSessionCredentials: () => ({
      hash,
      publicKey,
      signature,
    }),
    platform: 'WEB',
    url: getEnvPreset().contactMs,
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
}): userApi.UserPrivateApi {
  return userApi.privateApi({
    clientVersion: 1,
    getUserSessionCredentials: () => ({
      hash,
      publicKey,
      signature,
    }),
    platform: 'WEB',
    url: getEnvPreset().userMs,
  })
}
