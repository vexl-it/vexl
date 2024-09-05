import {Schema} from '@effect/schema'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Option} from 'effect'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {createClientInstanceWithAuth} from '../../client'
import {CommonHeaders} from '../../commonHeaders'
import {
  handleCommonAndExpectedErrorsEffect,
  handleCommonErrorsEffect,
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
import { HEADER_PLATFORM, HEADER_CLIENT_VERSION, HEADER_CRYPTO_VERSION } from '../../constants'

const encodeCommonHeaders = Schema.encodeSync(CommonHeaders)

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  platform,
  clientVersion,
  clientSemver,
  url,
  getUserSessionCredentials,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
}) {
  const client = createClientInstanceWithAuth({
    api: ContactApiSpecification,
    platform,
    clientVersion,
    clientSemver,
    getUserSessionCredentials,
    url,
  })

  const commonHeaders = new CommonHeaders({
    'user-agent': {
      _tag: 'VexlAppUserAgentHeader' as const,
      platform,
      versionCode: clientVersion,
      semver: Option.some(clientSemver),
    },
    [HEADER_PLATFORM]: Option.some(platform),
    [HEADER_CLIENT_VERSION]: Option.some(clientVersion) ?? 10,
    [HEADER_CRYPTO_VERSION]: Option.some(2),
  })

  return {
    checkUserExists: (checkUserExistsInput: CheckUserExistsInput) =>
      handleCommonErrorsEffect(client.checkUserExists(checkUserExistsInput)),
    createUser: (createUserInput: CreateUserInput) =>
      handleCommonErrorsEffect(
        client.createUser({
          body: createUserInput.body,
          headers: encodeCommonHeaders(commonHeaders),
        })
      ),
    refreshUser: (refreshUserInput: RefreshUserInput) =>
      handleCommonAndExpectedErrorsEffect(
        client.refreshUser({
          body: refreshUserInput.body,
          headers: encodeCommonHeaders(commonHeaders),
        }),
        UserNotFoundError
      ),
    updateFirebaseToken: (updateFirebaseTokenInput: UpdateFirebaseTokenInput) =>
      handleCommonErrorsEffect(
        client.updateFirebaseToken({
          body: updateFirebaseTokenInput.body,
          headers: encodeCommonHeaders(commonHeaders),
        })
      ),
    deleteUser: () => {
      handleCommonErrorsEffect(client.deleteUser({}))
    },
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
