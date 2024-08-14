import {Schema} from '@effect/schema'

export const VersionCode = Schema.Number.pipe(Schema.brand('VersionCode'))
export type VersionCode = Schema.Schema.Type<typeof VersionCode>
