import {z} from 'zod'

export const PlatformName = z.enum(['CLI', 'ANDROID', 'IOS', 'WEB'])

export type PlatformName = z.TypeOf<typeof PlatformName>
