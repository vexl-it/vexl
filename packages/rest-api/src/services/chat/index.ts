import {Schema} from '@effect/schema'
import {type PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder'
import {type SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type CreateAxiosDefaults} from 'axios'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import urlJoin from 'url-join'
import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {
  axiosCallWithValidation,
  createAxiosInstanceWithAuthAndLogging,
  type LoggingFunction,
} from '../../utils'
import {
  InboxDoesNotExistError,
  NotPermittedToSendMessageToTargetInboxError,
} from '../contact/contracts'
import {
  ApproveRequestResponse,
  BlockInboxResponse,
  CancelApprovalResponse,
  CreateChallengeResponse,
  CreateChallengeResponseE,
  CreateChallengesResponse,
  CreateChallengesResponseE,
  CreateInboxResponse,
  DeleteInboxResponse,
  DeleteInboxesResponse,
  DeletePulledMessagesResponse,
  LeaveChatResponse,
  OtherSideAccountDeleted,
  ReceiverInboxDoesNotExistError,
  RequestApprovalResponse,
  RequestCancelledError,
  RequestNotFoundError,
  RequestNotPendingError,
  RetrieveMessagesResponse,
  SendMessageResponse,
  SendMessagesResponse,
  SenderInboxDoesNotExistError,
  UpdateInboxResponse,
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
import {addChallengeToRequest} from './utils'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function privateApi({
  platform,
  clientVersion,
  clientSemver,
  url,
  getUserSessionCredentials,
  axiosConfig,
  loggingFunction,
}: {
  platform: PlatformName
  clientVersion: VersionCode
  clientSemver: SemverString
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
  loggingFunction?: LoggingFunction | null
}) {
  const axiosInstance = createAxiosInstanceWithAuthAndLogging(
    getUserSessionCredentials,
    platform,
    clientVersion,
    clientSemver,
    {
      ...axiosConfig,
      baseURL: urlJoin(url, '/api/v1'),
    },
    loggingFunction
  )

  const addChallenge = addChallengeToRequest(axiosInstance)

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
    updateInbox(data: RequestWithGeneratableChallenge<UpdateInboxRequest>) {
      return pipe(
        addChallenge(data),
        TE.chainW((data) =>
          axiosCallWithValidation(
            axiosInstance,
            {method: 'put', url: '/inboxes', data},
            UpdateInboxResponse
          )
        )
      )
    },
    createInbox(data: RequestWithGeneratableChallenge<CreateInboxRequest>) {
      return pipe(
        addChallenge(data),
        TE.chainW((data) =>
          axiosCallWithValidation(
            axiosInstance,
            {method: 'post', url: '/inboxes', data},
            CreateInboxResponse
          )
        )
      )
    },
    deleteInbox(data: RequestWithGeneratableChallenge<DeleteInboxRequest>) {
      return pipe(
        addChallenge(data),
        TE.chainW((data) =>
          axiosCallWithValidation(
            axiosInstance,
            {method: 'delete', url: '/inboxes', data},
            DeleteInboxResponse
          )
        )
      )
    },
    deletePulledMessages(
      data: RequestWithGeneratableChallenge<DeletePulledMessagesRequest>
    ) {
      return pipe(
        addChallenge(data),
        TE.chainW((data) =>
          axiosCallWithValidation(
            axiosInstance,
            {method: 'delete', url: '/inboxes/messages', data},
            DeletePulledMessagesResponse
          )
        )
      )
    },
    blockInbox(data: RequestWithGeneratableChallenge<BlockInboxRequest>) {
      return pipe(
        addChallenge(data),
        TE.chainW((data) =>
          axiosCallWithValidation(
            axiosInstance,
            {method: 'put', url: '/inboxes/block', data},
            BlockInboxResponse
          )
        )
      )
    },
    requestApproval(data: RequestApprovalRequest) {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {
            method: 'post',
            url: '/inboxes/approval/request',
            data,
          },
          RequestApprovalResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100101') {
              return new ReceiverInboxDoesNotExistError()
            }
          }
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100107') {
              return new SenderInboxDoesNotExistError()
            }
          }
          return e
        })
      )
    },
    cancelRequestApproval(data: CancelApprovalRequest) {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {
            method: 'post',
            url: '/inboxes/approval/cancel',
            data,
          },
          CancelApprovalResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100104') {
              return new RequestNotFoundError()
            }
            if (e.response.data.code === '100153') {
              return new RequestNotPendingError()
            }
            if (e.response.data.code === '100101') {
              return new OtherSideAccountDeleted()
            }
          }
          return e
        })
      )
    },
    approveRequest(
      originalData: RequestWithGeneratableChallenge<ApproveRequestRequest>
    ) {
      return pipe(
        addChallenge(originalData),
        TE.chainW((data) =>
          axiosCallWithValidation(
            axiosInstance,
            {
              method: 'post',
              url: '/inboxes/approval/confirm',
              data,
            },
            ApproveRequestResponse
          )
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100106') {
              return new RequestCancelledError()
            }
            if (e.response.data.code === '100104') {
              return new RequestNotFoundError()
            }
            if (e.response.data.code === '100153') {
              return new RequestNotPendingError()
            }
            if (e.response.data.code === '100101') {
              return new OtherSideAccountDeleted()
            }
          }
          return e
        })
      )
    },
    deleteInboxes(data: DeleteInboxesRequest) {
      return axiosCallWithValidation(
        axiosInstance,
        {method: 'delete', url: '/inboxes/batch', data},
        DeleteInboxesResponse
      )
    },
    leaveChat(originalData: RequestWithGeneratableChallenge<LeaveChatRequest>) {
      return pipe(
        addChallenge(originalData),
        TE.map(({publicKey, ...data}) => ({
          ...data,
          senderPublicKey: publicKey,
        })),
        TE.chainW((data) =>
          axiosCallWithValidation(
            axiosInstance,
            {
              method: 'post',
              url: '/inboxes/leave-chat',
              data,
            },
            LeaveChatResponse
          )
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100104') {
              return new NotPermittedToSendMessageToTargetInboxError()
            }
            if (e.response.data.code === '100101') {
              return new InboxDoesNotExistError()
            }
          }
          return e
        })
      )
    },
    // ----------------------
    // 👇 Message
    // ----------------------
    retrieveMessages(
      data: RequestWithGeneratableChallenge<RetrieveMessagesRequest>
    ) {
      return pipe(
        addChallenge(data),
        TE.chainW((data) =>
          axiosCallWithValidation(
            axiosInstance,
            {method: 'put', url: '/inboxes/messages', data},
            RetrieveMessagesResponse
          )
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100101') {
              return new InboxDoesNotExistError()
            }
          }
          return e
        })
      )
    },
    sendMessage(
      originalData: RequestWithGeneratableChallenge<SendMessageRequest>
    ) {
      return pipe(
        addChallenge(originalData),
        TE.map(
          ({publicKey, ...data}) =>
            ({
              ...data,
              senderPublicKey: publicKey,
            }) satisfies SendMessageRequest
        ),
        TE.chainW((data) =>
          axiosCallWithValidation(
            axiosInstance,
            {
              method: 'post',
              url: '/inboxes/messages',
              data,
            },
            SendMessageResponse
          )
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100101') {
              return new InboxDoesNotExistError()
            }
            if (e.response.data.code === '100102') {
              return new NotPermittedToSendMessageToTargetInboxError()
            }
          }
          return e
        })
      )
    },
    sendMessages(data: SendMessagesRequest) {
      return axiosCallWithValidation(
        axiosInstance,
        {method: 'post', url: '/inboxes/messages/batch', data},
        SendMessagesResponse
      )
    },
    // ----------------------
    // 👇 Challenge
    // ----------------------
    createChallenge(data: CreateChallengeRequest) {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {method: 'POST', url: '/challenges', data},
          CreateChallengeResponse
        ),
        TE.map((one) => Schema.decodeSync(CreateChallengeResponseE)(one))
      )
    },
    createChallengeBatch(data: CreateChallengesRequest) {
      return pipe(
        axiosCallWithValidation(
          axiosInstance,
          {method: 'POST', url: '/challenges/batch', data},
          CreateChallengesResponse
        ),
        TE.map((one) => Schema.decodeSync(CreateChallengesResponseE)(one))
      )
    },
  }
}

export type ChatPrivateApi = ReturnType<typeof privateApi>
