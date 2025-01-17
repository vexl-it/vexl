import {
  SemverStringE,
  type SemverString,
} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Array, Either, Number, Option, Schema, String} from 'effect'
import {PlatformName} from './PlatformName'
import {
  HEADER_CLIENT_VERSION,
  HEADER_CRYPTO_VERSION,
  HEADER_PLATFORM,
} from './constants'

export const VexlAppUserAgentHeader = Schema.TaggedStruct(
  'VexlAppUserAgentHeader' as const,
  {
    platform: PlatformName,
    versionCode: VersionCode,
    semver: Schema.optionalWith(SemverStringE, {as: 'Option'}),
  }
)
export type UserAgentHeader = Schema.Schema.Type<typeof VexlAppUserAgentHeader>

export const UnknownUserAgentHeader = Schema.TaggedStruct(
  'UnknownUserAgentHeader' as const,
  {
    userAgent: Schema.optionalWith(Schema.String, {as: 'Option'}),
  }
)
export type UnknownUserAgentHeader = typeof UnknownUserAgentHeader.Type

export const UserAgentHeader = Schema.Union(
  VexlAppUserAgentHeader,
  UnknownUserAgentHeader
)

const removeBrackets = String.replaceAll(/\(|\)/g, '')

export const UserAgentHeaderFromString = Schema.transform(
  Schema.Union(Schema.String, Schema.Undefined),
  UserAgentHeader,
  {
    strict: true,
    encode: (v) =>
      v._tag === 'VexlAppUserAgentHeader'
        ? `Vexl/${v.versionCode} (${v.semver}) ${v.platform}`
        : v.userAgent,
    decode: (v) => {
      if (!v) {
        return {
          _tag: 'UnknownUserAgentHeader' as const,
        }
      }

      const fragments = String.split(v, ' ')

      const [first] = fragments
      const second = Array.get(fragments, 1)
      const third = Array.get(fragments, 2)

      if (!first.startsWith('Vexl/')) {
        return {
          _tag: 'UnknownUserAgentHeader' as const,
          userAgent: v,
        }
      }

      const appVersion = first.replace('Vexl/', '')
      const appVersionNumber = Number.parse(appVersion)
      if (Option.isNone(appVersionNumber)) {
        return {
          _tag: 'UnknownUserAgentHeader' as const,
          userAgent: v,
        }
      }

      if (Option.isSome(second) && Option.isSome(third)) {
        const platform = Schema.decodeUnknownEither(PlatformName)(third.value)
        if (Either.isLeft(platform)) {
          return {
            _tag: 'UnknownUserAgentHeader' as const,
            userAgent: v,
          }
        }
        const semver = removeBrackets(second.value)

        return {
          _tag: 'VexlAppUserAgentHeader' as const,
          platform: platform.right,
          versionCode: appVersionNumber.value,
          semver,
        }
      }

      if (Option.isSome(second)) {
        const platform = Schema.decodeUnknownEither(PlatformName)(second.value)
        if (Either.isLeft(platform)) {
          return {
            _tag: 'UnknownUserAgentHeader' as const,
            userAgent: v,
          }
        }

        return {
          _tag: 'VexlAppUserAgentHeader' as const,
          platform: platform.right,
          versionCode: appVersionNumber.value,
          semver: undefined,
        }
      }

      return {
        _tag: 'UnknownUserAgentHeader' as const,
        userAgent: v,
      }
    },
  }
)

export class CommonHeaders extends Schema.Class<CommonHeaders>('CommonHeaders')(
  {
    'user-agent': UserAgentHeaderFromString,
    [HEADER_CLIENT_VERSION]: Schema.optionalWith(
      Schema.compose(Schema.NumberFromString, VersionCode),
      {as: 'Option'}
    ),
    [HEADER_PLATFORM]: Schema.optionalWith(PlatformName, {as: 'Option'}),
    [HEADER_CRYPTO_VERSION]: Schema.optionalWith(Schema.NumberFromString, {
      as: 'Option',
    }),
  }
) {
  get clientVersionOrNone(): Option.Option<VersionCode> {
    if (this['user-agent']._tag === 'VexlAppUserAgentHeader') {
      return Option.some(this['user-agent'].versionCode)
    }
    return this[HEADER_CLIENT_VERSION]
  }

  get clientSemverOrNone(): Option.Option<SemverString> {
    if (this['user-agent']._tag === 'VexlAppUserAgentHeader') {
      return this['user-agent'].semver
    }
    return Option.none()
  }

  get clientPlatformOrNone(): Option.Option<PlatformName> {
    if (this['user-agent']._tag === 'VexlAppUserAgentHeader') {
      return Option.some(this['user-agent'].platform)
    }
    return this[HEADER_PLATFORM]
  }
}
