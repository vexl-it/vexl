import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, Option} from 'effect'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {createClientInstanceWithAuth} from '../../client'
import {makeCommonHeaders, type AppSource} from '../../commonHeaders'
import {type LoggingFunction} from '../../utils'
import {
  addChallengeToRequest2,
  type RequestWithGeneratableChallenge,
} from '../utils/addChallengeToRequest2'
import {
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

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function api({
  platform,
  clientVersion,
  clientSemver,
  language,
  isDeveloper,
  appSource,
  url,
  getUserSessionCredentials,
  loggingFunction,
  deviceModel,
  osVersion,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  isDeveloper: boolean
  language: string
  appSource: AppSource
  deviceModel?: string
  osVersion?: string
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  loggingFunction?: LoggingFunction | null
}) {
  return Effect.gen(function* (_) {
    const client = yield* _(
      createClientInstanceWithAuth({
        api: ChatApiSpecification,
        platform,
        clientVersion,
        clientSemver,
        language,
        isDeveloper,
        appSource,
        getUserSessionCredentials,
        url,
        loggingFunction,
        deviceModel,
        osVersion,
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
    })

    const addChallenge = addChallengeToRequest2(
      client.Challenges.createChallenge
    )

    return {
      // ----------------------
      // 👇 Inbox
      // ----------------------
      updateInbox: (
        updateInboxRequest: RequestWithGeneratableChallenge<UpdateInboxRequest>
      ) =>
        addChallenge(updateInboxRequest).pipe(
          Effect.flatMap((body) => client.Inboxes.updateInbox({payload: body}))
        ),
      createInbox: (
        createInboxRequest: RequestWithGeneratableChallenge<CreateInboxRequest>
      ) =>
        addChallenge(createInboxRequest).pipe(
          Effect.flatMap((body) =>
            client.Inboxes.createInbox({
              payload: body,
              headers: commonHeaders,
            })
          )
        ),
      deleteInbox: (
        deleteInboxRequest: RequestWithGeneratableChallenge<DeleteInboxRequest>
      ) =>
        addChallenge(deleteInboxRequest).pipe(
          Effect.flatMap((body) => client.Inboxes.deleteInbox({payload: body}))
        ),
      deletePulledMessages: (
        deletePulledMessagesRequest: RequestWithGeneratableChallenge<DeletePulledMessagesRequest>
      ) =>
        addChallenge(deletePulledMessagesRequest).pipe(
          Effect.flatMap((body) =>
            client.Inboxes.deletePulledMessages({payload: body})
          )
        ),
      blockInbox: (
        blockInboxRequest: RequestWithGeneratableChallenge<BlockInboxRequest>
      ) =>
        addChallenge(blockInboxRequest).pipe(
          Effect.flatMap((body) => client.Inboxes.blockInbox({payload: body}))
        ),
      requestApproval: (requestApprovalRequest: RequestApprovalRequest) =>
        client.Inboxes.requestApproval({payload: requestApprovalRequest}),
      cancelRequestApproval: (cancelApprovalRequest: CancelApprovalRequest) =>
        client.Inboxes.cancelRequestApproval({payload: cancelApprovalRequest}),
      approveRequest: (
        approveRequestRequest: RequestWithGeneratableChallenge<ApproveRequestRequest>
      ) =>
        addChallenge(approveRequestRequest).pipe(
          Effect.flatMap((body) =>
            client.Inboxes.approveRequest({payload: body})
          )
        ),
      deleteInboxes: (deleteInboxesRequest: DeleteInboxesRequest) =>
        client.Inboxes.deleteInboxes({payload: deleteInboxesRequest}),
      leaveChat: (
        leaveChatRequest: RequestWithGeneratableChallenge<LeaveChatRequest>
      ) =>
        addChallenge(leaveChatRequest).pipe(
          Effect.flatMap((body) => client.Inboxes.leaveChat({payload: body}))
        ),
      // ----------------------
      // 👇 Message
      // ----------------------
      retrieveMessages: (
        retrieveMessagesRequest: RequestWithGeneratableChallenge<RetrieveMessagesRequest>
      ) =>
        addChallenge(retrieveMessagesRequest).pipe(
          Effect.flatMap((body) =>
            client.Messages.retrieveMessages({
              payload: body,
              headers: commonHeaders,
            })
          )
        ),
      sendMessage: (
        sendMessageRequest: RequestWithGeneratableChallenge<SendMessageRequest>
      ) =>
        addChallenge(sendMessageRequest).pipe(
          Effect.flatMap((body) =>
            client.Messages.sendMessage({
              payload: body,
            })
          )
        ),
      sendMessages: (sendMessagesRequest: SendMessagesRequest) =>
        client.Messages.sendMessages({payload: sendMessagesRequest}),
      // ----------------------
      // 👇 Challenge
      // ----------------------
      createChallenge: (createChallengeRequest: CreateChallengeRequest) =>
        client.Challenges.createChallenge({payload: createChallengeRequest}),
      createChallengeBatch: (
        createChallengesRequest: CreateChallengesRequest
      ) =>
        client.Challenges.createChallengeBatch({
          payload: createChallengesRequest,
        }),
    }
  })
}

export type ChatApi = Effect.Effect.Success<ReturnType<typeof api>>
