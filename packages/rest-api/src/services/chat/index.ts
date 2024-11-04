import {Schema} from '@effect/schema'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect} from 'effect'
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
  ApproveRequestErrors,
  CancelRequestApprovalErrors,
  LeaveChatErrors,
  RequestApprovalErrors,
  RetrieveMessagesErrors,
  SendMessageErrors,
  type ApproveRequestRequest,
  type BlockInboxRequest,
  type CancelApprovalRequest,
  type CreateChallengeRequest,
  type CreateChallengesRequest,
  type CreateInboxRequest,
  type DeleteInboxRequest,
  type DeleteInboxesRequest,
  type DeletePulledMessagesRequest,
  type LeaveChatRequest,
  type RequestApprovalRequest,
  type RetrieveMessagesRequest,
  type SendMessageRequest,
  type SendMessagesRequest,
  type UpdateInboxRequest,
} from './contracts'
import {ChatApiSpecification} from './specification'
import {addChallengeToRequest} from './utils'

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
    api: ChatApiSpecification,
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

  const addChallenge = addChallengeToRequest(client)

  type RequestWithGeneratableChallenge<T> = Omit<
    T,
    'publicKey' | 'signedChallenge'
  > & {
    keyPair: PrivateKeyHolder
  }

  return {
    // ----------------------
    // 👇 Inbox
    // ----------------------
    updateInbox: (
      updateInboxRequest: RequestWithGeneratableChallenge<UpdateInboxRequest>
    ) =>
      addChallenge(updateInboxRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonErrorsEffect(client.updateInbox({body}))
        )
      ),
    createInbox: (
      createInboxRequest: RequestWithGeneratableChallenge<CreateInboxRequest>
    ) =>
      addChallenge(createInboxRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonErrorsEffect(
            client.createInbox({
              body,
              headers: decodeCommonHeaders(commonHeaders),
            })
          )
        )
      ),
    deleteInbox: (
      deleteInboxRequest: RequestWithGeneratableChallenge<DeleteInboxRequest>
    ) =>
      addChallenge(deleteInboxRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonErrorsEffect(client.deleteInbox({body}))
        )
      ),
    deletePulledMessages: (
      deletePulledMessagesRequest: RequestWithGeneratableChallenge<DeletePulledMessagesRequest>
    ) =>
      addChallenge(deletePulledMessagesRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonErrorsEffect(client.deletePulledMessages({body}))
        )
      ),
    blockInbox: (
      blockInboxRequest: RequestWithGeneratableChallenge<BlockInboxRequest>
    ) =>
      addChallenge(blockInboxRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonErrorsEffect(client.blockInbox({body}))
        )
      ),
    requestApproval: (requestApprovalRequest: RequestApprovalRequest) =>
      handleCommonAndExpectedErrorsEffect(
        client.requestApproval({body: requestApprovalRequest}),
        RequestApprovalErrors
      ),
    cancelRequestApproval: (cancelApprovalRequest: CancelApprovalRequest) =>
      handleCommonAndExpectedErrorsEffect(
        client.cancelRequestApproval({body: cancelApprovalRequest}),
        CancelRequestApprovalErrors
      ),
    approveRequest: (
      approveRequestRequest: RequestWithGeneratableChallenge<ApproveRequestRequest>
    ) =>
      addChallenge(approveRequestRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.approveRequest({body}),
            ApproveRequestErrors
          )
        )
      ),
    deleteInboxes: (deleteInboxesRequest: DeleteInboxesRequest) =>
      handleCommonErrorsEffect(
        client.deleteInboxes({body: deleteInboxesRequest})
      ),
    leaveChat: (
      leaveChatRequest: RequestWithGeneratableChallenge<LeaveChatRequest>
    ) =>
      addChallenge(leaveChatRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.leaveChat({body}),
            LeaveChatErrors
          )
        )
      ),
    // ----------------------
    // 👇 Message
    // ----------------------
    retrieveMessages: (
      retrieveMessagesRequest: RequestWithGeneratableChallenge<RetrieveMessagesRequest>
    ) =>
      addChallenge(retrieveMessagesRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.retrieveMessages({
              body,
              headers: decodeCommonHeaders(commonHeaders),
            }),
            RetrieveMessagesErrors
          )
        )
      ),
    sendMessage: (
      sendMessageRequest: RequestWithGeneratableChallenge<SendMessageRequest>
    ) =>
      addChallenge(sendMessageRequest).pipe(
        Effect.flatMap((body) =>
          handleCommonAndExpectedErrorsEffect(
            client.sendMessage({
              body,
            }),
            SendMessageErrors
          )
        )
      ),
    sendMessages: (sendMessagesRequest: SendMessagesRequest) =>
      handleCommonAndExpectedErrorsEffect(
        client.sendMessages({body: sendMessagesRequest}),
        SendMessageErrors
      ),
    // ----------------------
    // 👇 Challenge
    // ----------------------
    createChallenge: (createChallengeRequest: CreateChallengeRequest) =>
      handleCommonErrorsEffect(
        client.createChallenge({body: createChallengeRequest})
      ),
    createChallengeBatch: (createChallengesRequest: CreateChallengesRequest) =>
      handleCommonErrorsEffect(
        client.createChallengeBatch({body: createChallengesRequest})
      ),
  }
}

export type ChatApi = ReturnType<typeof api>
