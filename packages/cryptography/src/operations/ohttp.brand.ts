import {Schema} from 'effect'

/** Base64 RFC 9458 key config. Public, shipped to clients. */
export const OhttpKeyConfig = Schema.String.pipe(Schema.brand('OhttpKeyConfig'))
export type OhttpKeyConfig = typeof OhttpKeyConfig.Type

/** Base64 key id + X25519 private key. Gateway-only secret. */
export const OhttpGatewaySecret = Schema.String.pipe(
  Schema.brand('OhttpGatewaySecret')
)
export type OhttpGatewaySecret = typeof OhttpGatewaySecret.Type
