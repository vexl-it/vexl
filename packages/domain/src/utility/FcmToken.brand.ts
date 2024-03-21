import {z} from 'zod'

export const FcmToken = z.string().brand<'FcmToken'>()

export type FcmToken = z.TypeOf<typeof FcmToken>
