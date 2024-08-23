import {Schema} from '@effect/schema'
import {z} from 'zod'

export const PlatformName = z.enum(['CLI', 'ANDROID', 'IOS', 'WEB'])

export type PlatformName = z.TypeOf<typeof PlatformName>

export const PlatformNameE = Schema.Literal('CLI', 'ANDROID', 'IOS', 'WEB')

export type PlatformNameE = Schema.Schema.Type<typeof PlatformNameE>
