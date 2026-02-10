import {PublicKeyV2} from '@vexl-next/cryptography'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {CryptoBoxSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {ParseResult, pipe, Schema, String} from 'effect/index'

const AUTHORIZATION_PREFIX = 'VexlAuth '
const SEPARATOR = '.'

export const UserDataShape = Schema.compose(
  Schema.StringFromBase64,
  Schema.parseJson(
    Schema.Struct({
      pk: PublicKeyV2,
      hash: HashedPhoneNumber,
    })
  )
)

const AuthorizationShape = Schema.Struct({
  data: UserDataShape,
  signature: CryptoBoxSignature,
})

function parseData(input: string): {
  data: string
  signature: string
} {
  if (!input.startsWith(AUTHORIZATION_PREFIX)) {
    throw new Error('Invalid authorization format')
  }

  const parsedData = pipe(
    input,
    String.slice(AUTHORIZATION_PREFIX.length),
    String.split(SEPARATOR)
  )
  const [data, signature] = parsedData

  if (signature === undefined) {
    throw new Error('Invalid authorization format')
  }

  return {data, signature}
}

export const VexlAuthHeader = Schema.transformOrFail(
  Schema.String,
  AuthorizationShape,
  {
    strict: true,
    decode: (s, _, ast) =>
      ParseResult.try({
        try: () => parseData(s),
        catch: (e: any) => new ParseResult.Type(ast, s, e.message),
      }),
    encode: (url, _, ast) =>
      ParseResult.try({
        try: () =>
          `${AUTHORIZATION_PREFIX}${url.data}${SEPARATOR}${url.signature}`,
        catch: (e: any) => new ParseResult.Type(ast, url, e.message),
      }),
  }
)

export type VexlAuthHeader = typeof VexlAuthHeader.Type
