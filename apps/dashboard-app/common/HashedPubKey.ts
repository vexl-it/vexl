import {Schema} from 'effect'

export const HashedPubKey = Schema.String.pipe(Schema.brand('HashedPubKey'))
export type HashedPubKey = Schema.Schema.Type<typeof HashedPubKey>
