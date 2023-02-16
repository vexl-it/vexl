import {z} from 'zod'

export const UriString = z.string().url().brand<'UriString'>()
export type UriString = z.TypeOf<typeof UriString>
