import {PublicKeyV2} from '@vexl-next/cryptography'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {CryptoBoxSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  Effect,
  pipe,
  Schema,
  SchemaIssue,
  SchemaTransformation,
  String,
} from 'effect'

const AUTHORIZATION_PREFIX = 'VexlAuth '
const SEPARATOR = '.'

export const UserDataShape = Schema.StringFromBase64.pipe(
  Schema.decodeTo(
    Schema.fromJsonString(
      Schema.Struct({
        pk: PublicKeyV2,
        hash: HashedPhoneNumber,
      })
    )
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

export const VexlAuthHeader = Schema.String.pipe(
  Schema.decodeTo(
    AuthorizationShape,
    SchemaTransformation.transformOrFail({
      decode: (value: string) =>
        Effect.try({
          try: () => parseData(value),
          catch: () =>
            new SchemaIssue.InvalidValue({
              message: 'Invalid authorization format',
            }),
        }),
      encode: (value: typeof AuthorizationShape.Encoded) =>
        Effect.succeed(
          `${AUTHORIZATION_PREFIX}${value.data}${SEPARATOR}${value.signature}`
        ),
    })
  )
)

export type VexlAuthHeader = typeof VexlAuthHeader.Type
