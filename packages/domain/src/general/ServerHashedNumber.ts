import {Schema, String} from 'effect/index'

export const SERVER_HASH_PREFIX = 'ServerHash:'

export const ServerHashedNumber = Schema.String.pipe(
  Schema.filter(String.startsWith(SERVER_HASH_PREFIX)),
  Schema.brand('ServerHashedNumber')
)
export type ServerHashedNumber = typeof ServerHashedNumber.Type
