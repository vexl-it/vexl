import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ClubAdmitionRequest,
  ClubCode,
} from '@vexl-next/domain/src/general/clubs'
import {parseUrlWithSearchParams} from '@vexl-next/domain/src/utility/parseUrlWithSearchParams'
import {
  compare,
  VersionString,
} from '@vexl-next/domain/src/utility/VersionString.brand'
import {Effect, flow, Option, Schema, SchemaTransformation} from 'effect'
import {ImportContactFromLinkPayloadE} from '../../state/contacts/domain'
import {version} from '../environment'
import {PreviewChannel} from '../prPreview/domain'
import {
  LINK_TYPE_GOLDEN_GLASSES,
  LINK_TYPE_IMPORT_CONTACT,
  LINK_TYPE_IMPORT_CONTACT_V2,
  LINK_TYPE_JOIN_CLUB,
  LINK_TYPE_LOAD_PR_PREVIEW,
  LINK_TYPE_OPEN_CHAT,
  LINK_TYPE_REQUEST_CLUB_ADMITION,
  VEXL_LINK_ORIGIN,
} from './domain'

export class InvalidDeepLinkError extends Schema.TaggedError<InvalidDeepLinkError>(
  'InvalidDeepLinkError'
)('InvalidDeepLinkError', {
  cause: Schema.Unknown,
  originalLink: Schema.Unknown,
}) {}

export class DeepLinkMeantForNewerVersionError extends Schema.TaggedError<DeepLinkMeantForNewerVersionError>(
  'DeepLinkMeantForNewerVersionError'
)('DeepLinkMeantForNewerVersionError', {
  minimalVersionRequired: Schema.optional(VersionString),
}) {}

const DeeplinkPayloadVersion = Schema.Struct({
  version: Schema.OptionFromOptional(VersionString).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
})

const DeepLinkGoldenGlassesWithType = Schema.Struct({
  ...DeeplinkPayloadVersion.fields,
  type: Schema.Literal(LINK_TYPE_GOLDEN_GLASSES),
})

const DeepLinkGoldenGlassesWithLinkBackwardCompatible = Schema.Struct({
  ...DeeplinkPayloadVersion.fields,
  link: Schema.Literal(LINK_TYPE_GOLDEN_GLASSES),
}).pipe(
  Schema.decodeTo(
    Schema.toType(DeepLinkGoldenGlassesWithType),
    SchemaTransformation.transform<
      typeof DeepLinkGoldenGlassesWithType.Type,
      typeof DeeplinkPayloadVersion.Type & {
        link: typeof LINK_TYPE_GOLDEN_GLASSES
      }
    >({
      encode: (value: typeof DeepLinkGoldenGlassesWithType.Type) => ({
        ...value,
        link: value.type,
      }),
      decode: (
        value: typeof DeeplinkPayloadVersion.Type & {
          link: typeof LINK_TYPE_GOLDEN_GLASSES
        }
      ) => ({...value, type: value.link}),
    })
  )
)

export const DeepLinkGoldenGlasses = Schema.Union([
  DeepLinkGoldenGlassesWithType,
  DeepLinkGoldenGlassesWithLinkBackwardCompatible,
])

export const DeepLinkClubJoin = Schema.Struct({
  ...DeeplinkPayloadVersion.fields,
  type: Schema.Literal(LINK_TYPE_JOIN_CLUB),
  code: ClubCode,
})

export const DeepLinkImportContact = Schema.Struct({
  ...DeeplinkPayloadVersion.fields,
  type: Schema.Literal(LINK_TYPE_IMPORT_CONTACT),
  data: Schema.fromJsonString(ImportContactFromLinkPayloadE),
})

export const DeepLinkImportContactV2 = Schema.Struct({
  ...DeeplinkPayloadVersion.fields,
  type: Schema.Literal(LINK_TYPE_IMPORT_CONTACT_V2),
  ...ImportContactFromLinkPayloadE.fields,
})

export const DeepLinkRequestClubAdmition = Schema.Struct({
  ...DeeplinkPayloadVersion.fields,
  type: Schema.Literal(LINK_TYPE_REQUEST_CLUB_ADMITION),
  ...ClubAdmitionRequest.fields,
})
export type DeepLinkRequestClubAdmition =
  typeof DeepLinkRequestClubAdmition.Type

export const DeepLinkLoadPrPreview = Schema.Struct({
  ...DeeplinkPayloadVersion.fields,
  type: Schema.Literal(LINK_TYPE_LOAD_PR_PREVIEW),
  channel: PreviewChannel,
})

// Only generated on-device (Android conversation shortcuts), never shared.
export const DeepLinkOpenChat = Schema.Struct({
  ...DeeplinkPayloadVersion.fields,
  type: Schema.Literal(LINK_TYPE_OPEN_CHAT),
  inbox: PublicKeyPemBase64,
  sender: PublicKeyPemBase64,
})

export const DeepLinkData = parseUrlWithSearchParams(
  Schema.Union([
    DeepLinkGoldenGlasses,
    DeepLinkClubJoin,
    DeepLinkImportContact,
    DeepLinkImportContactV2,
    DeepLinkRequestClubAdmition,
    DeepLinkLoadPrPreview,
    DeepLinkOpenChat,
  ])
)
export type DeepLinkData = typeof DeepLinkData.Type

const validateLinkVersion = flow(
  Schema.decodeEffect(parseUrlWithSearchParams(DeeplinkPayloadVersion)),
  Effect.filterOrFail(
    (versionLink) => {
      if (Option.isNone(versionLink.searchParams.version)) {
        return true
      }
      return compare(versionLink.searchParams.version.value)('<=', version)
    },
    (a) =>
      new DeepLinkMeantForNewerVersionError({
        minimalVersionRequired: Option.getOrUndefined(a.searchParams.version),
      })
  )
)

const VEXL_STAGING_APP_LINK_PREFIX = 'stagingapp.vexl.it://'

function normalizeAppLink(link: string): string {
  return link.startsWith(VEXL_STAGING_APP_LINK_PREFIX)
    ? link.replace(VEXL_STAGING_APP_LINK_PREFIX, `${VEXL_LINK_ORIGIN}/`)
    : link
}

export const parseDeepLink = (
  link: string
): Effect.Effect<
  DeepLinkData,
  InvalidDeepLinkError | DeepLinkMeantForNewerVersionError
> => {
  const normalizedLink = normalizeAppLink(link)

  return Effect.andThen(
    validateLinkVersion(normalizedLink),
    Schema.decodeEffect(DeepLinkData)(normalizedLink)
  ).pipe(
    Effect.catchTag(
      'SchemaError',
      (e) => new InvalidDeepLinkError({cause: e, originalLink: link})
    )
  )
}
