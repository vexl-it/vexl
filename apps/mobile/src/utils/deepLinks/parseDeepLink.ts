import {
  ClubAdmitionRequest,
  ClubCode,
} from '@vexl-next/domain/src/general/clubs'
import {parseUrlWithSearchParams} from '@vexl-next/domain/src/utility/parseUrlWithSearchParams'
import {
  compare,
  SemverString,
} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {Effect, flow, Option, Schema} from 'effect'
import {ImportContactFromLinkPayloadE} from '../../state/contacts/domain'
import {version} from '../environment'
import {
  LINK_TYPE_GOLDEN_GLASSES,
  LINK_TYPE_IMPORT_CONTACT,
  LINK_TYPE_IMPORT_CONTACT_V2,
  LINK_TYPE_JOIN_CLUB,
  LINK_TYPE_REQUEST_CLUB_ADMITION,
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
  minimalVersionRequired: Schema.optional(SemverString),
}) {}

const DeeplinkPayloadVersion = Schema.Struct({
  version: Schema.optionalWith(SemverString, {as: 'Option'}),
})

const DeepLinkGoldenGlassesWithType = Schema.Struct({
  ...DeeplinkPayloadVersion.fields,
  type: Schema.Literal(LINK_TYPE_GOLDEN_GLASSES),
})

const DeepLinkGoldenGlassesWithLinkBackwardCompatible = Schema.transform(
  Schema.Struct({
    ...DeeplinkPayloadVersion.fields,
    link: Schema.Literal(LINK_TYPE_GOLDEN_GLASSES),
  }),
  DeepLinkGoldenGlassesWithType,
  {
    encode: (i, a) => ({...a, link: a.type}),
    decode: (i, a) => ({...a, type: a.link}),
    strict: true,
  }
)

export const DeepLinkGoldenGlasses = Schema.Union(
  DeepLinkGoldenGlassesWithType,
  DeepLinkGoldenGlassesWithLinkBackwardCompatible
)

export const DeepLinkClubJoin = Schema.Struct({
  ...DeeplinkPayloadVersion.fields,
  type: Schema.Literal(LINK_TYPE_JOIN_CLUB),
  code: ClubCode,
})

export const DeepLinkImportContact = Schema.Struct({
  ...DeeplinkPayloadVersion.fields,
  type: Schema.Literal(LINK_TYPE_IMPORT_CONTACT),
  data: Schema.parseJson(ImportContactFromLinkPayloadE),
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

export const DeepLinkData = parseUrlWithSearchParams(
  Schema.Union(
    DeepLinkGoldenGlasses,
    DeepLinkClubJoin,
    DeepLinkImportContact,
    DeepLinkImportContactV2,
    DeepLinkRequestClubAdmition
  )
)
export type DeepLinkData = typeof DeepLinkData.Type

const validateLinkVersion = flow(
  Schema.decode(parseUrlWithSearchParams(DeeplinkPayloadVersion)),
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

export const parseDeepLink = (
  link: string
): Effect.Effect<
  DeepLinkData,
  InvalidDeepLinkError | DeepLinkMeantForNewerVersionError
> =>
  Effect.zipRight(
    validateLinkVersion(link),
    Schema.decode(DeepLinkData)(link)
  ).pipe(
    Effect.catchTag(
      'ParseError',
      (e) => new InvalidDeepLinkError({cause: e, originalLink: link})
    )
  )
