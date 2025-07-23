import {Schema} from 'effect'

export const PlatformName = Schema.Literal('CLI', 'ANDROID', 'IOS', 'WEB')

export type PlatformName = Schema.Schema.Type<typeof PlatformName>

export const PLATFORM_IOS = Schema.decodeSync(PlatformName)('IOS')
export const PLATFORM_ANDROID = Schema.decodeSync(PlatformName)('ANDROID')
