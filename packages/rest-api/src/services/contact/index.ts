import {Schema} from '@effect/schema'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {createClientInstanceWithAuth} from '../../client'
import {CommonHeaders} from '../../commonHeaders'
import {
  handleCommonAndExpectedErrorsEffect,
  handleCommonErrorsEffect,
  type LoggingFunction,
} from '../../utils'
import {
  type CheckUserExistsInput,
  type CreateUserInput,
  type FetchCommonConnectionsInput,
  type FetchMyContactsInput,
  ImportContactsErrors,
  type ImportContactsInput,
  type RefreshUserInput,
  type UpdateFirebaseTokenInput,
  UserNotFoundError,
} from './contracts'
import {ContactApiSpecification} from './specification'

const decodeCommonHeaders = Schema.decodeSync(CommonHeaders)

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  platform,
  clientVersion,
  clientSemver,
  url,
  getUserSessionCredentials,
  signal,
  loggingFunction,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  signal?: AbortSignal
  loggingFunction?: LoggingFunction | null
}) {
  const client = createClientInstanceWithAuth({
    api: ContactApiSpecification,
    platform,
    clientVersion,
    clientSemver,
    getUserSessionCredentials,
    url,
    signal,
    loggingFunction,
  })

  const commonHeaders = {
    'user-agent': `Vexl/${clientVersion} (${clientSemver}) ${platform}`,
  }

  return {
    checkUserExists: (checkUserExistsInput: CheckUserExistsInput) =>
      handleCommonErrorsEffect(client.checkUserExists(checkUserExistsInput)),
    createUser: (createUserInput: CreateUserInput) =>
      handleCommonErrorsEffect(
        client.createUser({
          body: createUserInput.body,
          headers: decodeCommonHeaders(commonHeaders),
        })
      ),
    refreshUser: (refreshUserInput: RefreshUserInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.refreshUser({
          body: refreshUserInput.body,
          headers: decodeCommonHeaders(commonHeaders),
        }),
        UserNotFoundError
      ),
    updateFirebaseToken: (updateFirebaseTokenInput: UpdateFirebaseTokenInput) =>
      handleCommonErrorsEffect(
        client.updateFirebaseToken({
          body: updateFirebaseTokenInput.body,
          headers: decodeCommonHeaders(commonHeaders),
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
  }
}

export type ContactApi = ReturnType<typeof api>
