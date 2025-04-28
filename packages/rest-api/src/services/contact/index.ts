import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect} from 'effect'
import {createClientInstanceWithAuth} from '../../client'
import {type AppSource, makeCommonHeaders} from '../../commonHeaders'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  handleCommonAndExpectedErrorsEffect,
  handleCommonErrorsEffect,
  type LoggingFunction,
} from '../../utils'
import {
  addChallengeToRequest,
  type RequestWithGeneratableChallenge,
} from '../utils/addChallengeToRequest'
import {
  AddUserToTheClubErrors,
  type AddUserToTheClubRequest,
  type CheckUserExistsInput,
  type CreateUserInput,
  DeactivateClubJoinLinkErrors,
  type DeactivateClubJoinLinkRequest,
  type FetchCommonConnectionsInput,
  type FetchMyContactsInput,
  GenerateClubJoinLinkErrors,
  type GenerateClubJoinLinkRequest,
  GetClubContactsErrors,
  type GetClubContactsRequest,
  GetClubInfoByAccessCodeErrors,
  type GetClubInfoByAccessCodeRequest,
  GetClubInfoErrors,
  type GetClubInfoRequest,
  ImportContactsErrors,
  type ImportContactsInput,
  JoinClubErrors,
  type JoinClubRequest,
  LeaveClubErrors,
  type LeaveClubRequest,
  ListClubLinksErrors,
  type ListClubLinksRequest,
  type RefreshUserInput,
  ReportClubErrors,
  type ReportClubRequest,
  UpdateBadOwnerHashErrors,
  type UpdateBadOwnerHashRequest,
  type UpdateNotificationTokenRequest,
  UserNotFoundError,
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
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  isDeveloper: boolean
  language: string
  appSource: AppSource
  getUserSessionCredentials: GetUserSessionCredentials
  loggingFunction?: LoggingFunction | null
}) {
  const client = createClientInstanceWithAuth({
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
  })

  const addChallenge = addChallengeToRequest(client)

  const commonHeaders = makeCommonHeaders({
    appSource,
    versionCode: clientVersion,
    semver: clientSemver,
    platform,
    isDeveloper,
    language,
  })

  return {
    checkUserExists: (checkUserExistsInput: CheckUserExistsInput) =>
      handleCommonErrorsEffect(client.checkUserExists(checkUserExistsInput)),
    createUser: (createUserInput: CreateUserInput) =>
      handleCommonErrorsEffect(
        client.createUser({
          body: createUserInput.body,
          headers: commonHeaders,
        })
      ),
    refreshUser: (refreshUserInput: RefreshUserInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.refreshUser({
          body: refreshUserInput.body,
          headers: commonHeaders,
        }),
        UserNotFoundError
      ),
    updateNotificationToken: ({body}: {body: UpdateNotificationTokenRequest}) =>
      handleCommonErrorsEffect(
        client.updateNotificationToken({
          body,
          headers: commonHeaders,
        })
      ),
    deleteUser: () => handleCommonErrorsEffect(client.deleteUser({})),
    importContacts: (importContactsInput: ImportContactsInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.importContacts(importContactsInput),
        ImportContactsErrors
      ),
    fetchMyContacts: (fetchMyContactsInput: FetchMyContactsInput) =>
      handleCommonErrorsEffect(client.fetchMyContacts(fetchMyContactsInput)),
    fetchCommonConnections: (
      fetchCommonConnectionsInput: FetchCommonConnectionsInput
    ) =>
      handleCommonErrorsEffect(
        client.fetchCommonConnections(fetchCommonConnectionsInput)
      ),
    updateBadOwnerHash: (args: UpdateBadOwnerHashRequest) =>
      handleCommonAndExpectedErrorsEffect(
        client.updateBadOwnerHash({body: args}),
        UpdateBadOwnerHashErrors
      ),
    getClubContacts: (
      getClubContactsRequest: RequestWithGeneratableChallenge<GetClubContactsRequest>
    ) =>
      addChallenge(getClubContactsRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.getClubContacts({body}),
            GetClubContactsErrors
          )
        )
      ),
    joinClub: (
      joinClubRequest: RequestWithGeneratableChallenge<JoinClubRequest>
    ) =>
      addChallenge(joinClubRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.joinClub({
              body,
            }),
            JoinClubErrors
          )
        )
      ),
    getClubInfo: (
      getClubInfoRequest: RequestWithGeneratableChallenge<GetClubInfoRequest>
    ) =>
      addChallenge(getClubInfoRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.getClubInfo({body}),
            GetClubInfoErrors
          )
        )
      ),
    leaveClub: (
      leaveClubRequest: RequestWithGeneratableChallenge<LeaveClubRequest>
    ) =>
      addChallenge(leaveClubRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.leaveClub({body}),
            LeaveClubErrors
          )
        )
      ),
    getClubInfoByAccessCode: (
      getClubInfoByAccessCodeRequest: RequestWithGeneratableChallenge<GetClubInfoByAccessCodeRequest>
    ) =>
      addChallenge(getClubInfoByAccessCodeRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.getClubInfoByAccessCode({body}),
            GetClubInfoByAccessCodeErrors
          )
        )
      ),
    generateClubJoinLink: (
      generateClubJoinLinkRequest: RequestWithGeneratableChallenge<GenerateClubJoinLinkRequest>
    ) =>
      addChallenge(generateClubJoinLinkRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.generateClubJoinLink({body}),
            GenerateClubJoinLinkErrors
          )
        )
      ),
    deactivateClubJoinLink: (
      deactivateClubJoinLinkRequest: RequestWithGeneratableChallenge<DeactivateClubJoinLinkRequest>
    ) =>
      addChallenge(deactivateClubJoinLinkRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.deactivateClubJoinLink({body}),
            DeactivateClubJoinLinkErrors
          )
        )
      ),
    addUserToTheClub: (
      addUserToTheClubRequest: RequestWithGeneratableChallenge<AddUserToTheClubRequest>
    ) =>
      addChallenge(addUserToTheClubRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.addUserToTheClub({body}),
            AddUserToTheClubErrors
          )
        )
      ),
    listClubLinks: (
      getClubInfoByAccessCodeRequest: RequestWithGeneratableChallenge<ListClubLinksRequest>
    ) =>
      addChallenge(getClubInfoByAccessCodeRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.listClubLinks({body}),
            ListClubLinksErrors
          )
        )
      ),
    reportClub: (
      reportClubRequest: RequestWithGeneratableChallenge<ReportClubRequest>
    ) =>
      addChallenge(reportClubRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.reportClub({body}),
            ReportClubErrors
          )
        )
      ),
  }
}

export type ContactApi = ReturnType<typeof api>
