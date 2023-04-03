import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type CreateAxiosDefaults} from 'axios'
import urlJoin from 'url-join'
import * as TE from 'fp-ts/TaskEither'
import {
  axiosCallWithValidation,
  createAxiosInstanceWithAuthAndLogging,
} from '../../utils'
import {
  type ApproveRequestRequest,
  ApproveRequestResponse,
  type BlockInboxRequest,
  BlockInboxResponse,
  type CreateChallengeRequest,
  CreateChallengeResponse,
  type CreateChallengesRequest,
  CreateChallengesResponse,
  type CreateInboxRequest,
  CreateInboxResponse,
  type DeleteInboxesResponse,
  type DeleteInboxRequest,
  DeleteInboxResponse,
  type DeletePulledMessagesRequest,
  DeletePulledMessagesResponse,
  type RequestApprovalRequest,
  RequestApprovalResponse,
  type RetrieveMessagesRequest,
  RetrieveMessagesResponse,
  type SendMessageRequest,
  SendMessageResponse,
  type SendMessagesRequest,
  SendMessagesResponse,
  type UpdateInboxRequest,
  UpdateInboxResponse,
} from './contracts'
import {pipe} from 'fp-ts/function'
import {addChallengeToRequest} from './utils'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function privateApi({
  platform,
  url,
  getUserSessionCredentials,
  axiosConfig,
}: {
  platform: PlatformName
  url: ServiceUrl
  getUserSessionCredentials: GetUserSessionCredentials
  axiosConfig?: Omit<CreateAxiosDefaults, 'baseURL'>
}) {
  const axiosInstance = createAxiosInstanceWithAuthAndLogging(
    getUserSessionCredentials,
    platform,
    {
      ...axiosConfig,
      baseURL: urlJoin(url, '/api/v1'),
    }
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
      return axiosCallWithValidation(
        axiosInstance,
        {method: 'post', url: '/inboxes/approval/request', data},
        RequestApprovalResponse
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
        )
      )
    },
    deleteInboxes(data: DeleteInboxesResponse) {
      return axiosCallWithValidation(
        axiosInstance,
        {method: 'delete', url: '/inboxes/batch', data},
        DeleteInboxResponse
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
        )
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
        )
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
