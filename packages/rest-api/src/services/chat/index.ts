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
  CreateChallengesResponse,
  CreateInboxResponse,
  DeleteInboxResponse,
  DeleteInboxesResponse,
  DeletePulledMessagesResponse,
  LeaveChatResponse,
  OtherSideAccountDeleted,
  ReceiverOfferInboxDoesNotExistError,
  RequestAlreadyApprovedError,
  RequestApprovalResponse,
  RequestCancelledError,
  RequestNotFoundError,
  RetrieveMessagesResponse,
  SendMessageResponse,
  SendMessagesResponse,
  SenderUserInboxDoesNotExistError,
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
          {
            method: 'post',
            url: '/inboxes/approval/request',
            data,
            params: {
              notificationServiceReady: data.notificationServiceReady,
            },
          },
          RequestApprovalResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100101') {
              return new ReceiverOfferInboxDoesNotExistError()
            }
          }
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100107') {
              return new SenderUserInboxDoesNotExistError()
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
            params: {
              notificationServiceReady: data.notificationServiceReady,
            },
          },
          CancelApprovalResponse
        ),
        TE.mapLeft((e) => {
          if (e._tag === 'BadStatusCodeError') {
            if (e.response.data.code === '100104') {
              return new RequestNotFoundError()
            }
            if (e.response.data.code === '100153') {
              return new RequestAlreadyApprovedError()
            }
            if (e.response.data.code === '100101') {
              return new OtherSideAccountDeleted()
            }
          }
          return e
        })
      )
    },
    approveRequest(originalData: ApproveRequestRequest) {
      return pipe(
        addChallenge(originalData),
        TE.chainW((data) =>
          axiosCallWithValidation(
            axiosInstance,
            {
              method: 'post',
              url: '/inboxes/approval/confirm',
              data,
              params: {
                notificationServiceReady: originalData.notificationServiceReady,
              },
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
              return new RequestAlreadyApprovedError()
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
    leaveChat(originalData: LeaveChatRequest) {
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
              params: {
                notificationServiceReady: originalData.notificationServiceReady,
              },
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
              return new InboxDoesNotExistError()
            }
          }
          return e
        })
      )
    },
    sendMessage(originalData: SendMessageRequest) {
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
              url: '/inboxes/messages',
              data,
              params: {
                notificationServiceReady: originalData.notificationServiceReady,
              },
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
