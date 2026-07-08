import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, Option} from 'effect'
import {makeRequestWithCommonAndSecurityHeaders} from '../../apiSecurity'
import {type CreateChallengeRequest} from '../../challenges/contracts'
import {createClientInstance} from '../../client'
import {makeCommonHeaders, type AppSource} from '../../commonHeaders'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type LoggingFunction} from '../../utils'
import {
  addChallengeToRequest2,
  type RequestWithGeneratableChallenge,
} from '../utils/addChallengeToRequest2'
import {
  type CreateNewOfferRequest,
  type CreatePrivatePartRequest,
  type DeleteOfferRequest,
  type DeletePrivatePartRequest,
  type GetClubOffersForMeCreatedOrModifiedAfterPaginatedRequest,
  type GetOffersForMeCreatedOrModifiedAfterPaginatedRequest,
  type RefreshOfferRequest,
  type RemovedClubOfferIdsRequest,
  type RemovedOfferIdsRequest,
  type ReportClubOfferRequest,
  type ReportOfferRequest,
  type UpdateOfferRequest,
} from './contracts'
import {
  type CreateNewNoteRequest,
  type CreateNotePrivatePartRequest,
  type CreateRepostNotePrivatePartRequest,
  type DeleteNotePrivatePartRequest,
  type DeleteNoteRequest,
  type GetNotesForMeCreatedOrModifiedAfterPaginatedRequest,
  type RemovedNoteIdsRequest,
  type ReportNoteRequest,
  type RepostNoteRequest,
  type UndoRepostNoteRequest,
} from './notesContracts'
import {OfferApiSpecification} from './specification'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  platform,
  clientVersion,
  clientSemver,
  url,
  language,
  appSource,
  isDeveloper,
  getUserSessionCredentials,
  loggingFunction,
  deviceModel,
  osVersion,
  prefix,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  language: string
  isDeveloper: boolean
  appSource: AppSource
  clientSemver: SemverString
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  loggingFunction?: LoggingFunction | null
  deviceModel?: string
  osVersion?: string
  prefix?: CountryPrefix
}) {
  return Effect.gen(function* (_) {
    const client = yield* _(
      createClientInstance({
        api: OfferApiSpecification,
        platform,
        clientVersion,
        clientSemver,
        language,
        isDeveloper,
        appSource,
        url,
        loggingFunction,
        deviceModel,
        osVersion,
        prefix,
      })
    )

    const commonHeaders = makeCommonHeaders({
      appSource,
      versionCode: clientVersion,
      semver: clientSemver,
      platform,
      isDeveloper,
      language,
      deviceModel: Option.fromNullable(deviceModel),
      osVersion: Option.fromNullable(osVersion),
      prefix: Option.fromNullable(prefix),
    })

    // Security headers are built lazily inside each request effect (not once
    // at api construction) so every authenticated request reads the current
    // session credentials and a failing credentials read can never throw
    // synchronously out of the code constructing the request.
    const withSecurityHeaders = makeRequestWithCommonAndSecurityHeaders(
      getUserSessionCredentials,
      commonHeaders
    )

    const addChallenge = addChallengeToRequest2(
      client.Challenges.createChallenge
    )

    return {
      getOffersForMeModifiedOrCreatedAfterPaginated: (
        req: GetOffersForMeCreatedOrModifiedAfterPaginatedRequest
      ) =>
        withSecurityHeaders((headers) =>
          client.getOffersForMeModifiedOrCreatedAfterPaginated({
            urlParams: req,
            headers,
          })
        ),
      getClubOffersForMeModifiedOrCreatedAfterPaginated: (
        body: RequestWithGeneratableChallenge<GetClubOffersForMeCreatedOrModifiedAfterPaginatedRequest>
      ) =>
        addChallenge(body).pipe(
          Effect.flatMap((body) =>
            client.getClubOffersForMeModifiedOrCreatedAfterPaginated({
              payload: body,
            })
          )
        ),
      createNewOffer: (body: CreateNewOfferRequest) =>
        withSecurityHeaders((headers) =>
          client.createNewOffer({payload: body, headers})
        ),
      refreshOffer: (body: RefreshOfferRequest) =>
        client.refreshOffer({payload: body}),
      deleteOffer: (req: DeleteOfferRequest) =>
        client.deleteOffer({urlParams: req}),
      updateOffer: (body: UpdateOfferRequest) =>
        withSecurityHeaders((headers) =>
          client.updateOffer({payload: body, headers})
        ),
      createPrivatePart: (body: CreatePrivatePartRequest) =>
        client.createPrivatePart({payload: body}),
      deletePrivatePart: (req: DeletePrivatePartRequest) =>
        withSecurityHeaders((headers) =>
          client.deletePrivatePart({payload: req, headers})
        ),
      getRemovedOffers: (body: RemovedOfferIdsRequest) =>
        withSecurityHeaders((headers) =>
          client.getRemovedOffers({payload: body, headers})
        ),
      getRemovedClubOffers: (
        body: RequestWithGeneratableChallenge<RemovedClubOfferIdsRequest>
      ) =>
        addChallenge(body).pipe(
          Effect.flatMap((body) => client.getRemovedClubOffers({payload: body}))
        ),
      reportOffer: (body: ReportOfferRequest) =>
        withSecurityHeaders((headers) =>
          client.reportOffer({payload: body, headers})
        ),
      reportClubOffer: (
        body: RequestWithGeneratableChallenge<ReportClubOfferRequest>
      ) =>
        addChallenge(body).pipe(
          Effect.flatMap((body) =>
            withSecurityHeaders((headers) =>
              client.reportClubOffer({payload: body, headers})
            )
          )
        ),
      // ----------------------
      // 👇 Notes
      // ----------------------
      getNotesForMeModifiedOrCreatedAfterPaginated: (
        req: GetNotesForMeCreatedOrModifiedAfterPaginatedRequest
      ) =>
        withSecurityHeaders((headers) =>
          client.Notes.getNotesForMeModifiedOrCreatedAfterPaginated({
            urlParams: req,
            headers,
          })
        ),
      createNewNote: (body: CreateNewNoteRequest) =>
        withSecurityHeaders((headers) =>
          client.Notes.createNewNote({payload: body, headers})
        ),
      deleteNote: (req: DeleteNoteRequest) =>
        client.Notes.deleteNote({urlParams: req}),
      createNotePrivatePart: (body: CreateNotePrivatePartRequest) =>
        client.Notes.createNotePrivatePart({payload: body}),
      deleteNotePrivatePart: (req: DeleteNotePrivatePartRequest) =>
        withSecurityHeaders((headers) =>
          client.Notes.deleteNotePrivatePart({payload: req, headers})
        ),
      createRepostNotePrivatePart: (body: CreateRepostNotePrivatePartRequest) =>
        client.Notes.createRepostNotePrivatePart({payload: body}),
      repostNote: (body: RepostNoteRequest) =>
        withSecurityHeaders((headers) =>
          client.Notes.repostNote({payload: body, headers})
        ),
      undoRepostNote: (req: UndoRepostNoteRequest) =>
        client.Notes.undoRepostNote({urlParams: req}),
      getRemovedNotes: (body: RemovedNoteIdsRequest) =>
        withSecurityHeaders((headers) =>
          client.Notes.getRemovedNotes({payload: body, headers})
        ),
      reportNote: (body: ReportNoteRequest) =>
        withSecurityHeaders((headers) =>
          client.Notes.reportNote({payload: body, headers})
        ),
      // ----------------------
      // 👇 Challenge
      // ----------------------
      createChallenge: (createChallengeRequest: CreateChallengeRequest) =>
        client.Challenges.createChallenge({payload: createChallengeRequest}),
    }
  })
}

export type OfferApi = Effect.Effect.Success<ReturnType<typeof api>>
