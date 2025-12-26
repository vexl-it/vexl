import {Schema} from 'effect'

export const FcmToken = Schema.String.pipe(Schema.brand('FcmToken'))
export type FcmToken = typeof FcmToken.Type
