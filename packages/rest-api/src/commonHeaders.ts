import {
  SemverStringE,
  type SemverString,
} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Array, Either, Number, Option, Schema, String} from 'effect'
import {PlatformName} from './PlatformName'
import {HEADER_CLIENT_VERSION, HEADER_PLATFORM} from './constants'

export const AppSource = Schema.String.pipe(Schema.brand('AppSource'))
// Schema.Literal(
//   'playStore',
//   'appStore',
//   'altStore',
//   'APK',
//   'local',
//   'account-deletion-page',
//   'unknown'
// )
export type AppSource = typeof AppSource.Type

// used for backwards compatibility only. Use Vexl App metaHeader instead
export const VexlAppUserAgentHeader = Schema.TaggedStruct(
  'VexlAppUserAgentHeader' as const,
  {
    platform: PlatformName,
    versionCode: VersionCode,
    semver: Schema.optionalWith(SemverStringE, {as: 'Option', nullable: true}),
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

export const VexlAppMetaHeader = Schema.Struct({
  platform: PlatformName,
  versionCode: VersionCode,
  semver: SemverStringE,
  appSource: AppSource,
  language: Schema.String,
  isDeveloper: Schema.Boolean,
  // TODO backward compatibility
  deviceModel: Schema.optionalWith(Schema.String, {as: 'Option'}),
  osVersion: Schema.optionalWith(Schema.String, {as: 'Option'}),
})
export type VexlAppMetaHeader = Schema.Schema.Type<typeof VexlAppMetaHeader>

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
    'vexl-app-meta': Schema.optional(Schema.parseJson(VexlAppMetaHeader)),
    'cf-connecting-ip': Schema.optionalWith(Schema.String, {as: 'Option'}),
    [HEADER_CLIENT_VERSION]: Schema.optionalWith(
      Schema.compose(Schema.NumberFromString, VersionCode),
      {as: 'Option'}
    ),
    [HEADER_PLATFORM]: Schema.optionalWith(PlatformName, {as: 'Option'}),
  }
) {
  get deviceModelOrNone(): Option.Option<string> {
    if (this['vexl-app-meta']) {
      return this['vexl-app-meta'].deviceModel
    }

    return Option.none()
  }

  get osVersionOrNone(): Option.Option<string> {
    if (this['vexl-app-meta']) {
      return this['vexl-app-meta'].osVersion
    }

    return Option.none()
  }

  get clientVersionOrNone(): Option.Option<VersionCode> {
    if (this['vexl-app-meta']) {
      return Option.some(this['vexl-app-meta'].versionCode)
    }

    if (this['user-agent']._tag === 'VexlAppUserAgentHeader') {
      return Option.some(this['user-agent'].versionCode)
    }
    return this[HEADER_CLIENT_VERSION]
  }

  get clientSemverOrNone(): Option.Option<SemverString> {
    if (this['vexl-app-meta']) {
      return Option.some(this['vexl-app-meta'].semver)
    }

    if (this['user-agent']._tag === 'VexlAppUserAgentHeader') {
      return this['user-agent'].semver
    }
    return Option.none()
  }

  get clientPlatformOrNone(): Option.Option<PlatformName> {
    if (this['vexl-app-meta']) {
      return Option.some(this['vexl-app-meta'].platform)
    }

    if (this['user-agent']._tag === 'VexlAppUserAgentHeader') {
      return Option.some(this['user-agent'].platform)
    }
    return this[HEADER_PLATFORM]
  }

  get appSourceOrNone(): Option.Option<AppSource> {
    if (this['vexl-app-meta']) {
      return Option.some(this['vexl-app-meta'].appSource)
    }

    return Option.none()
  }

  get language(): Option.Option<string> {
    if (this['vexl-app-meta']) {
      return Option.some(this['vexl-app-meta'].language)
    }

    return Option.none()
  }

  get isDeveloper(): boolean {
    if (this['vexl-app-meta']) {
      return this['vexl-app-meta'].isDeveloper
    }

    return false
  }
}

export const makeCommonHeaders = (
  VexlAppMetaHeader: VexlAppMetaHeader
): typeof CommonHeaders.Type => {
  return new CommonHeaders({
    'vexl-app-meta': VexlAppMetaHeader,
    'cf-connecting-ip': Option.none(), // This is set by the server
    'user-agent': {
      _tag: 'VexlAppUserAgentHeader',
      platform: VexlAppMetaHeader.platform,
      versionCode: VexlAppMetaHeader.versionCode,
      semver: Option.some(VexlAppMetaHeader.semver),
    },
    [HEADER_CLIENT_VERSION]: Option.some(VexlAppMetaHeader.versionCode),
    [HEADER_PLATFORM]: Option.some(VexlAppMetaHeader.platform),
  })
}
