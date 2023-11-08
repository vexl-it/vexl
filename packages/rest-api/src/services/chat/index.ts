import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type CreateAxiosDefaults} from 'axios'
import urlJoin from 'url-join'
import * as TE from 'fp-ts/TaskEither'
import {
  axiosCallWithValidation,
  createAxiosInstanceWithAuthAndLogging,
  type LoggingFunction,
} from '../../utils'
import {
  type ApproveRequestRequest,
  ApproveRequestResponse,
  type BlockInboxRequest,
  BlockInboxResponse,
  type CancelApprovalRequest,
  CancelApprovalResponse,
  type CreateChallengeRequest,
  CreateChallengeResponse,
  type CreateChallengesRequest,
  CreateChallengesResponse,
  type CreateInboxRequest,
  CreateInboxResponse,
  type DeleteInboxesRequest,
  DeleteInboxesResponse,
  type DeleteInboxRequest,
  DeleteInboxResponse,
  type DeletePulledMessagesRequest,
  DeletePulledMessagesResponse,
  type LeaveChatRequest,
  LeaveChatResponse,
  type OtherSideAccountDeleted,
  type ReceiverOfferInboxDoesNotExistError,
  type RequestAlreadyApprovedError,
  type RequestApprovalRequest,
  RequestApprovalResponse,
  type RequestCancelledError,
  type RequestNotFoundError,
  type RetrieveMessagesRequest,
  RetrieveMessagesResponse,
  type SenderUserInboxDoesNotExistError,
  type SendMessageRequest,
  SendMessageResponse,
  type SendMessagesRequest,
  SendMessagesResponse,
  type UpdateInboxRequest,
  UpdateInboxResponse,
} from './contracts'
import {pipe} from 'fp-ts/function'
import {addChallengeToRequest} from './utils'
import {
  type InboxDoesNotExist,
  type NotPermittedToSendMessageToTargetInbox,
} from '../contact/contracts'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function privateApi({
  platform,
  clientVersion,
  url,
  getUserSessionCredentials,
  axiosConfig,
  loggingFunction,
}: {
  platform: PlatformName
  clientVersion: number
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
  loggingFunction?: LoggingFunction | null
}) {
  const axiosInstance = createAxiosInstanceWithAuthAndLogging(
    getUserSessionCredentials,
    platform,
    clientVersion,
    {
      ...axiosConfig,
      baseURL: urlJoin(url, '/api/v1'),
    },
    loggingFunction
  )

  const addChallenge = addChallengeToRequest(axiosInstance)

  return {
    // ----------------------
    // 👇 Inbox
    // ----------------------
    updateInbox(data: UpdateInboxRequest) {
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
    createInbox(data: CreateInboxRequest) {
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
    deleteInbox(data: DeleteInboxRequest) {
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
    deletePulledMessages(data: DeletePulledMessagesRequest) {
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
    blockInbox(data: BlockInboxRequest) {
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
          {method: 'post', url: '/inboxes/approval/request', data},
          RequestApprovalResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100101') {
              return {
                _tag: 'ReceiverOfferInboxDoesNotExistError',
              } as ReceiverOfferInboxDoesNotExistError
            }
          }
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100107') {
              return {
                _tag: 'SenderUserInboxDoesNotExistError',
              } as SenderUserInboxDoesNotExistError
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
          {method: 'post', url: '/inboxes/approval/cancel', data},
          CancelApprovalResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100104') {
              return {
                _tag: 'RequestNotFoundError',
              } as RequestNotFoundError
            }
            if (e.response.data.code === '100153') {
              return {
                _tag: 'RequestAlreadyApprovedError',
              } as RequestAlreadyApprovedError
            }
            if (e.response.data.code === '100101') {
              return {
                _tag: 'OtherSideAccountDeleted',
              } as OtherSideAccountDeleted
            }
          }
          return e
        })
      )
    },
    approveRequest(data: ApproveRequestRequest) {
      return pipe(
        addChallenge(data),
        TE.chainW((data) =>
          axiosCallWithValidation(
            axiosInstance,
            {method: 'post', url: '/inboxes/approval/confirm', data},
            ApproveRequestResponse
          )
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100106') {
              return {_tag: 'RequestCancelledError'} as RequestCancelledError
            }
            if (e.response.data.code === '100104') {
              return {
                _tag: 'RequestNotFoundError',
              } as RequestNotFoundError
            }
            if (e.response.data.code === '100153') {
              return {
                _tag: 'RequestAlreadyApprovedError',
              } as RequestAlreadyApprovedError
            }
            if (e.response.data.code === '100101') {
              return {
                _tag: 'OtherSideAccountDeleted',
              } as OtherSideAccountDeleted
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
    leaveChat(data: LeaveChatRequest) {
      return pipe(
        addChallenge(data),
        TE.map(({publicKey, ...data}) => ({
          ...data,
          senderPublicKey: publicKey,
        })),
        TE.chainW((data) =>
          axiosCallWithValidation(
            axiosInstance,
            {method: 'post', url: '/inboxes/leave-chat', data},
            LeaveChatResponse
          )
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100104') {
              return {
                _tag: 'notPermittedToSendMessageToTargetInbox',
              } as NotPermittedToSendMessageToTargetInbox
            }
            if (e.response.data.code === '100101') {
              return {_tag: 'inboxDoesNotExist'} as InboxDoesNotExist
            }
          }
          return e
        })
      )
    },
    // ----------------------
    // 👇 Message
    // ----------------------
    retrieveMessages(data: RetrieveMessagesRequest) {
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
              return {_tag: 'inboxDoesNotExist'} as InboxDoesNotExist
            }
          }
          return e
        })
      )
    },
    sendMessage(data: SendMessageRequest) {
      return pipe(
        addChallenge(data),
        TE.map(({publicKey, ...data}) => ({
          ...data,
          senderPublicKey: publicKey,
        })),
        TE.chainW((data) =>
          axiosCallWithValidation(
            axiosInstance,
            {method: 'post', url: '/inboxes/messages', data},
            SendMessageResponse
          )
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100101') {
              return {_tag: 'inboxDoesNotExist'} as InboxDoesNotExist
            }
            if (e.response.data.code === '100102') {
              return {
                _tag: 'notPermittedToSendMessageToTargetInbox',
              } as NotPermittedToSendMessageToTargetInbox
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
      return axiosCallWithValidation(
        axiosInstance,
        {method: 'POST', url: '/challenges', data},
        CreateChallengeResponse
      )
    },
    createChallengeBatch(data: CreateChallengesRequest) {
      return axiosCallWithValidation(
        axiosInstance,
        {method: 'POST', url: '/challenges/batch', data},
        CreateChallengesResponse
      )
    },
  }
}

export type ChatPrivateApi = ReturnType<typeof privateApi>
