import {Schema, String} from 'effect/index'

export const SERVER_TO_CLIENT_HASHED_NUMBER_PREFIX = 'ServerToClientHash:'

export const ServerToClientHashedNumber = Schema.String.pipe(
  Schema.filter(String.startsWith(SERVER_TO_CLIENT_HASHED_NUMBER_PREFIX)),
  Schema.brand('ServerToClientHashedNumber')
)
export type ServerToClientHashedNumber = typeof ServerToClientHashedNumber.Type
