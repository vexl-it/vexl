import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect} from 'effect'
import {createClientInstanceWithAuth} from '../../client'
import {makeCommonHeaders, type AppSource} from '../../commonHeaders'
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
  GetClubContactsErrors,
  GetClubInfoByAccessCodeErrors,
  ImportContactsErrors,
  JoinClubErrors,
  UpdateBadOwnerHashErrors,
  UserNotFoundError,
  type CheckUserExistsInput,
  type CreateUserInput,
  type FetchCommonConnectionsInput,
  type FetchMyContactsInput,
  type GetClubContactsRequest,
  type GetClubInfoByAccessCodeRequest,
  type ImportContactsInput,
  type JoinClubRequest,
  type RefreshUserInput,
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
  }
}

export type ContactApi = ReturnType<typeof api>
