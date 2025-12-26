import {Schema} from 'effect'

export const UriString = Schema.String.pipe(Schema.brand('UriString'))
export type UriString = typeof UriString.Type
