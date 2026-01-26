import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {type PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, Option} from 'effect'
import {makeCommonAndSecurityHeaders} from '../../apiSecurity'
import {createClientInstance} from '../../client'
import {type AppSource, makeCommonHeaders} from '../../commonHeaders'
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
  type FetchCommonConnectionsRequest,
  type FetchMyContactsPaginatedRequest,
  type FetchMyContactsRequest,
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
  type UpdateBadOwnerHashRequest,
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

    const commonAndSecurityHeaders = makeCommonAndSecurityHeaders(
      getUserSessionCredentials,
      commonHeaders
    )

    return {
      checkUserExists: (query: CheckUserExistsRequest) =>
        client.User.checkUserExists({
          urlParams: query,
          headers: commonAndSecurityHeaders,
        }),
      createUser: (body: CreateUserRequest) =>
        client.User.createUser({
          payload: body,
          headers: commonAndSecurityHeaders,
        }),
      refreshUser: (body: RefreshUserRequest) =>
        client.User.refreshUser({
          payload: body,
          headers: commonAndSecurityHeaders,
        }),
      updateNotificationToken: ({
        body,
      }: {
        body: UpdateNotificationTokenRequest
      }) =>
        client.User.updateNotificationToken({
          payload: body,
          headers: commonAndSecurityHeaders,
        }),
      deleteUser: () =>
        client.User.deleteUser({headers: commonAndSecurityHeaders}),
      importContacts: (body: ImportContactsRequest) =>
        client.Contact.importContacts({
          payload: body,
          headers: commonAndSecurityHeaders,
        }),

      fetchMyContacts: (query: FetchMyContactsRequest) =>
        client.Contact.fetchMyContacts({
          headers: commonAndSecurityHeaders,
          urlParams: query,
        }),
      fetchMyContactsPaginated: (query: FetchMyContactsPaginatedRequest) =>
        client.Contact.fetchMyContactsPaginated({
          headers: commonAndSecurityHeaders,
          urlParams: query,
        }),
      fetchCommonConnections: (body: FetchCommonConnectionsRequest) =>
        client.Contact.fetchCommonConnections({
          payload: body,
          headers: commonAndSecurityHeaders,
        }),
      fetchCommonConnectionsPaginated: (
        body: FetchCommonConnectionsPaginatedRequest
      ) =>
        client.Contact.fetchCommonConnectionsPaginated({
          payload: body,
          headers: commonAndSecurityHeaders,
        }),
      convertPhoneNumberHashesToServerHashes: (
        body: ConvertPhoneNumberHashesToServerHashesRequest
      ) =>
        client.Contact.convertPhoneNumberHashesToServerHashes({
          payload: body,
        }),
      updateBadOwnerHash: (args: UpdateBadOwnerHashRequest) =>
        client.User.updateBadOwnerHash({payload: args}),
      getClubContacts: (
        getClubContactsRequest: RequestWithGeneratableChallenge<GetClubContactsRequest>
      ) =>
        addChallenge(getClubContactsRequest).pipe(
          Effect.flatMap((body) =>
            client.ClubsMember.getClubContacts({payload: body})
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
      reportClub: (
        reportClubRequest: RequestWithGeneratableChallenge<ReportClubRequest>
      ) =>
        addChallenge(reportClubRequest).pipe(
          Effect.flatMap((body) =>
            client.ClubsMember.reportClub({
              payload: body,
              headers: commonAndSecurityHeaders,
            })
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
