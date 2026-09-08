import {Schema} from 'effect'

export const HashedEmail = Schema.String.pipe(Schema.brand('HashedEmail'))
export type HashedEmail = typeof HashedEmail.Type
