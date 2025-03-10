import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Schema} from 'effect'
import {createClientInstanceWithAuth} from '../../client'
import {CommonHeaders} from '../../commonHeaders'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  handleCommonAndExpectedErrorsEffect,
  handleCommonErrorsEffect,
  type LoggingFunction,
} from '../../utils'
import {
  ImportContactsErrors,
  UpdateBadOwnerHashErrors,
  UserNotFoundError,
  type CheckUserExistsInput,
  type CreateUserInput,
  type FetchCommonConnectionsInput,
  type FetchMyContactsInput,
  type ImportContactsInput,
  type RefreshUserInput,
  type UpdateBadOwnerHashRequest,
  type UpdateNotificationTokenRequest,
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
  loggingFunction,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  loggingFunction?: LoggingFunction | null
}) {
  const client = createClientInstanceWithAuth({
    api: ContactApiSpecification,
    platform,
    clientVersion,
    clientSemver,
    getUserSessionCredentials,
    url,
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
    updateNotificationToken: ({body}: {body: UpdateNotificationTokenRequest}) =>
      handleCommonErrorsEffect(
        client.updateNotificationToken({
          body,
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
    updateBadOwnerHash: (args: UpdateBadOwnerHashRequest) =>
      handleCommonAndExpectedErrorsEffect(
        client.updateBadOwnerHash({body: args}),
        UpdateBadOwnerHashErrors
      ),
  }
}

export type ContactApi = ReturnType<typeof api>
