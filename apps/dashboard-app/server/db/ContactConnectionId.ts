import {Schema} from 'effect'

export const ContactConnectionId = Schema.Number.pipe(
  Schema.brand('ContactConnectionId')
)
export type ContactConnectionId = Schema.Schema.Type<typeof ContactConnectionId>
