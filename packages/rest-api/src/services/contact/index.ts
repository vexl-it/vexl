import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, Option} from 'effect'
import {createClientInstanceWithAuth} from '../../client'
import {type AppSource, makeCommonHeaders} from '../../commonHeaders'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type LoggingFunction} from '../../utils'
import {
  addChallengeToRequest2,
  type RequestWithGeneratableChallenge,
} from '../utils/addChallengeToRequest2'
import {
  type AddUserToTheClubRequest,
  type CheckUserExistsInput,
  type CreateUserInput,
  type DeactivateClubJoinLinkRequest,
  type EraseUserFromNetworkRequest,
  type FetchCommonConnectionsInput,
  type FetchMyContactsInput,
  type GenerateClubJoinLinkRequest,
  type GetClubContactsRequest,
  type GetClubInfoByAccessCodeRequest,
  type GetClubInfoRequest,
  type ImportContactsInput,
  type JoinClubRequest,
  type LeaveClubRequest,
  type ListClubLinksRequest,
  type RefreshUserInput,
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
}) {
  return Effect.gen(function* (_) {
    const client = yield* _(
      createClientInstanceWithAuth({
        api: ContactApiSpecification,
        platform,
        clientVersion,
        language,
        appSource,
        clientSemver,
        isDeveloper,
        getUserSessionCredentials,
        url,
        loggingFunction,
        deviceModel,
        osVersion,
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
    })

    return {
      checkUserExists: (checkUserExistsInput: CheckUserExistsInput) =>
        client.User.checkUserExists({urlParams: checkUserExistsInput.query}),
      createUser: (createUserInput: CreateUserInput) =>
        client.User.createUser({
          payload: createUserInput.body,
          headers: commonHeaders,
        }),
      refreshUser: (refreshUserInput: RefreshUserInput) =>
        client.User.refreshUser({
          payload: refreshUserInput.body,
          headers: commonHeaders,
        }),
      updateNotificationToken: ({
        body,
      }: {
        body: UpdateNotificationTokenRequest
      }) =>
        client.User.updateNotificationToken({
          payload: body,
          headers: commonHeaders,
        }),
      deleteUser: () => client.User.deleteUser({}),
      importContacts: (importContactsInput: ImportContactsInput) =>
        client.Contact.importContacts({payload: importContactsInput.body}),

      fetchMyContacts: (fetchMyContactsInput: FetchMyContactsInput) =>
        client.Contact.fetchMyContacts({
          headers: commonHeaders,
          urlParams: fetchMyContactsInput.query,
        }),
      fetchCommonConnections: (
        fetchCommonConnectionsInput: FetchCommonConnectionsInput
      ) =>
        client.Contact.fetchCommonConnections({
          payload: fetchCommonConnectionsInput.body,
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
            client.ClubsMember.reportClub({payload: body})
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
