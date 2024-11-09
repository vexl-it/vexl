import {Schema} from 'effect'

export const PlatformName = Schema.Literal('CLI', 'ANDROID', 'IOS', 'WEB')

export type PlatformName = Schema.Schema.Type<typeof PlatformName>
