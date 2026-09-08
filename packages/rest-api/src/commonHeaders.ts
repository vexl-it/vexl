import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {VersionString} from '@vexl-next/domain/src/utility/VersionString.brand'
import {NumberFromString} from '@vexl-next/generic-utils/src/effect-helpers/NumberFromString'
import {
  Array,
  Effect,
  Number,
  Option,
  Result,
  Schema,
  SchemaTransformation,
  String,
} from 'effect'
import {HEADER_CLIENT_VERSION, HEADER_PLATFORM} from './constants'

export const AppSource = Schema.String.pipe(Schema.brand('AppSource'))
// Schema.Literal(
//   'playStore',
//   'appStore',
//   'altStore',
//   'APK',
//   'local',
//   'web-app',
//   'unknown'
// )
export type AppSource = typeof AppSource.Type

// used for backwards compatibility only. Use Vexl App metaHeader instead
export const VexlAppUserAgentHeader = Schema.TaggedStruct(
  'VexlAppUserAgentHeader' as const,
  {
    platform: PlatformName,
    versionCode: VersionCode,
    semver: Schema.OptionFromOptionalNullOr(VersionString).pipe(
      Schema.withConstructorDefault(Effect.succeed(Option.none()))
    ),
  }
)
export type UserAgentHeader = Schema.Schema.Type<typeof VexlAppUserAgentHeader>

export const UnknownUserAgentHeader = Schema.TaggedStruct(
  'UnknownUserAgentHeader' as const,
  {
    userAgent: Schema.OptionFromOptional(Schema.String).pipe(
      Schema.withConstructorDefault(Effect.succeed(Option.none()))
    ),
  }
)
export type UnknownUserAgentHeader = typeof UnknownUserAgentHeader.Type

export const VexlAppMetaHeader = Schema.Struct({
  platform: PlatformName,
  versionCode: VersionCode,
  semver: VersionString,
  appSource: AppSource,
  language: Schema.String,
  isDeveloper: Schema.Boolean,
  // TODO backward compatibility
  deviceModel: Schema.OptionFromOptional(Schema.String).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  osVersion: Schema.OptionFromOptional(Schema.String).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  prefix: Schema.OptionFromOptional(CountryPrefix).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
})
export type VexlAppMetaHeader = Schema.Schema.Type<typeof VexlAppMetaHeader>

export const UserAgentHeader = Schema.Union([
  VexlAppUserAgentHeader,
  UnknownUserAgentHeader,
])

const removeBrackets = String.replaceAll(/\(|\)/g, '')

export const UserAgentHeaderFromString = Schema.Union([
  Schema.String,
  Schema.Undefined,
]).pipe(
  Schema.decodeTo(
    UserAgentHeader,
    SchemaTransformation.transform({
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
          const platform = Schema.decodeUnknownResult(PlatformName)(third.value)
          if (Result.isFailure(platform)) {
            return {
              _tag: 'UnknownUserAgentHeader' as const,
              userAgent: v,
            }
          }
          const semver = removeBrackets(second.value)

          return {
            _tag: 'VexlAppUserAgentHeader' as const,
            platform: platform.success,
            versionCode: appVersionNumber.value,
            semver,
          }
        }

        if (Option.isSome(second)) {
          const platform = Schema.decodeUnknownResult(PlatformName)(
            second.value
          )
          if (Result.isFailure(platform)) {
            return {
              _tag: 'UnknownUserAgentHeader' as const,
              userAgent: v,
            }
          }

          return {
            _tag: 'VexlAppUserAgentHeader' as const,
            platform: platform.success,
            versionCode: appVersionNumber.value,
            semver: undefined,
          }
        }

        return {
          _tag: 'UnknownUserAgentHeader' as const,
          userAgent: v,
        }
      },
    })
  )
)

export class CommonHeaders extends Schema.Class<CommonHeaders>('CommonHeaders')(
  {
    'user-agent': UserAgentHeaderFromString.pipe(
      Schema.withDecodingDefaultType(
        Effect.sync(
          (): UnknownUserAgentHeader => ({
            _tag: 'UnknownUserAgentHeader',
            userAgent: Option.none(),
          })
        )
      )
    ),
    'vexl-app-meta': Schema.optional(Schema.fromJsonString(VexlAppMetaHeader)),
    'cf-connecting-ip': Schema.OptionFromOptional(Schema.String).pipe(
      Schema.withConstructorDefault(Effect.succeed(Option.none()))
    ),
    [HEADER_CLIENT_VERSION]: Schema.OptionFromOptional(
      NumberFromString.pipe(Schema.decodeTo(VersionCode))
    ).pipe(Schema.withConstructorDefault(Effect.succeed(Option.none()))),
    [HEADER_PLATFORM]: Schema.OptionFromOptional(PlatformName).pipe(
      Schema.withConstructorDefault(Effect.succeed(Option.none()))
    ),
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

  get prefixOrNone(): Option.Option<CountryPrefix> {
    if (this['vexl-app-meta']) {
      return this['vexl-app-meta'].prefix
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

  get clientSemverOrNone(): Option.Option<VersionString> {
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

export const ConnectingIpHeader = Schema.Struct({
  'cf-connecting-ip': Schema.String,
})
