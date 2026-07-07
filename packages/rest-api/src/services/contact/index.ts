import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, Option} from 'effect'
import {makeRequestWithCommonAndSecurityHeaders} from '../../apiSecurity'
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
  type AddUserToTheClubRequest,
  type CheckUserExistsRequest,
  type ConvertPhoneNumberHashesToServerHashesRequest,
  type CreateUserRequest,
  type DeactivateClubJoinLinkRequest,
  type EraseUserFromNetworkRequest,
  type FetchCommonConnectionsPaginatedRequest,
  type FetchMyContactsPaginatedRequest,
  type GenerateClubJoinLinkRequest,
  type GetClubContactsRequest,
  type GetClubInfoByAccessCodeRequest,
  type GetClubInfoRequest,
  type ImportContactsRequest,
  type JoinClubRequest,
  type LeaveClubRequest,
  type ListClubLinksRequest,
  type RefreshUserRequest,
  type ReportClubRequest,
  type SetPublicKeyV2Request,
  type UpdateNotificationTokenRequest,
} from './contracts'
import {ContactApiSpecification} from './specification'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  platform,
  clientVersion,
  clientSemver,
  url,
  language,
  isDeveloper,
  appSource,
  getUserSessionCredentials,
  loggingFunction,
  deviceModel,
  osVersion,
  prefix,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  isDeveloper: boolean
  language: string
  deviceModel?: string
  osVersion?: string
  appSource: AppSource
  getUserSessionCredentials: GetUserSessionCredentials
  loggingFunction?: LoggingFunction | null
  prefix?: CountryPrefix
}) {
  return Effect.gen(function* (_) {
    const client = yield* _(
      createClientInstance({
        api: ContactApiSpecification,
        platform,
        clientVersion,
        language,
        appSource,
        clientSemver,
        isDeveloper,
        url,
        loggingFunction,
        deviceModel,
        osVersion,
        prefix,
      })
    )

    const addChallenge = addChallengeToRequest2(
      client.Challenges.createChallenge
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

    return {
      checkUserExists: (query: CheckUserExistsRequest) =>
        withSecurityHeaders((headers) =>
          client.User.checkUserExists({urlParams: query, headers})
        ),
      createUser: (body: CreateUserRequest) =>
        withSecurityHeaders((headers) =>
          client.User.createUser({payload: body, headers})
        ),
      refreshUser: (body: RefreshUserRequest) =>
        withSecurityHeaders((headers) =>
          client.User.refreshUser({payload: body, headers})
        ),
      updateNotificationToken: ({
        body,
      }: {
        body: UpdateNotificationTokenRequest
      }) =>
        withSecurityHeaders((headers) =>
          client.User.updateNotificationToken({payload: body, headers})
        ),
      deleteUser: () =>
        withSecurityHeaders((headers) => client.User.deleteUser({headers})),
      importContacts: (body: ImportContactsRequest) =>
        withSecurityHeaders((headers) =>
          client.Contact.importContacts({payload: body, headers})
        ),
      fetchMyContactsPaginated: (query: FetchMyContactsPaginatedRequest) =>
        withSecurityHeaders((headers) =>
          client.Contact.fetchMyContactsPaginated({
            headers,
            urlParams: query,
          })
        ),
      fetchCommonConnectionsPaginated: (
        body: FetchCommonConnectionsPaginatedRequest
      ) =>
        withSecurityHeaders((headers) =>
          client.Contact.fetchCommonConnectionsPaginated({
            payload: body,
            headers,
          })
        ),
      convertPhoneNumberHashesToServerHashes: (
        body: ConvertPhoneNumberHashesToServerHashesRequest
      ) =>
        client.Contact.convertPhoneNumberHashesToServerHashes({
          payload: body,
        }),
      getClubContacts: (
        getClubContactsRequest: RequestWithGeneratableChallenge<GetClubContactsRequest>
      ) =>
        addChallenge(getClubContactsRequest).pipe(
          Effect.flatMap((body) =>
            client.ClubsMember.getClubContacts({
              payload: body,
              headers: commonHeaders,
            })
          )
        ),
      joinClub: (
        joinClubRequest: RequestWithGeneratableChallenge<JoinClubRequest>
      ) =>
        addChallenge(joinClubRequest).pipe(
          Effect.flatMap((body) =>
            client.ClubsMember.joinClub({
              payload: body,
            })
          )
        ),
      getClubInfo: (
        getClubInfoRequest: RequestWithGeneratableChallenge<GetClubInfoRequest>
      ) =>
        addChallenge(getClubInfoRequest).pipe(
          Effect.flatMap((body) =>
            client.ClubsMember.getClubInfo({payload: body})
          )
        ),
      leaveClub: (
        leaveClubRequest: RequestWithGeneratableChallenge<LeaveClubRequest>
      ) =>
        addChallenge(leaveClubRequest).pipe(
          Effect.flatMap((body) =>
            client.ClubsMember.leaveClub({payload: body})
          )
        ),
      getClubInfoByAccessCode: (
        getClubInfoByAccessCodeRequest: RequestWithGeneratableChallenge<GetClubInfoByAccessCodeRequest>
      ) =>
        addChallenge(getClubInfoByAccessCodeRequest).pipe(
          Effect.flatMap((body) =>
            client.ClubsMember.getClubInfoByAccessCode({payload: body})
          )
        ),
      generateClubJoinLink: (
        generateClubJoinLinkRequest: RequestWithGeneratableChallenge<GenerateClubJoinLinkRequest>
      ) =>
        addChallenge(generateClubJoinLinkRequest).pipe(
          Effect.flatMap((body) =>
            client.ClubsModerator.generateClubJoinLink({payload: body})
          )
        ),
      deactivateClubJoinLink: (
        deactivateClubJoinLinkRequest: RequestWithGeneratableChallenge<DeactivateClubJoinLinkRequest>
      ) =>
        addChallenge(deactivateClubJoinLinkRequest).pipe(
          Effect.flatMap((body) =>
            client.ClubsModerator.deactivateClubJoinLink({payload: body})
          )
        ),
      addUserToTheClub: (
        addUserToTheClubRequest: RequestWithGeneratableChallenge<AddUserToTheClubRequest>
      ) =>
        addChallenge(addUserToTheClubRequest).pipe(
          Effect.flatMap((body) =>
            client.ClubsModerator.addUserToTheClub({payload: body})
          )
        ),
      listClubLinks: (
        getClubInfoByAccessCodeRequest: RequestWithGeneratableChallenge<ListClubLinksRequest>
      ) =>
        addChallenge(getClubInfoByAccessCodeRequest).pipe(
          Effect.flatMap((body) =>
            client.ClubsModerator.listClubLinks({payload: body})
          )
        ),
      setPublicKeyV2: (
        body: RequestWithGeneratableChallenge<SetPublicKeyV2Request>
      ) =>
        addChallenge(body).pipe(
          Effect.flatMap((body) =>
            withSecurityHeaders((headers) =>
              client.ClubsMember.setPublicKeyV2({payload: body, headers})
            )
          )
        ),
      reportClub: (
        reportClubRequest: RequestWithGeneratableChallenge<ReportClubRequest>
      ) =>
        addChallenge(reportClubRequest).pipe(
          Effect.flatMap((body) =>
            withSecurityHeaders((headers) =>
              client.ClubsMember.reportClub({payload: body, headers})
            )
          )
        ),
      eraseUserFromNetwork: (request: EraseUserFromNetworkRequest) =>
        client.User.eraseUserFromNetwork({
          payload: request,
        }),
    }
  })
}

export type ContactApi = Effect.Effect.Success<ReturnType<typeof api>>
