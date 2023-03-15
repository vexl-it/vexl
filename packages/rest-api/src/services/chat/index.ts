import {type PlatformName} from '../../PlatformName'
import {type ServiceUrl} from '../../ServiceUrl.brand'
import {type GetUserSessionCredentials} from '../../UserSessionCredentials.brand'
import {type CreateAxiosDefaults} from 'axios'
import urlJoin from 'url-join'
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

  return {
    // ----------------------
    // 👇 Inbox
    // ----------------------
    updateInbox(data: UpdateInboxRequest) {
      return axiosCallWithValidation(
        axiosInstance,
        {method: 'put', url: '/inboxes', data},
        UpdateInboxResponse
      )
    },
    createInbox(data: CreateInboxRequest) {
      return axiosCallWithValidation(
        axiosInstance,
        {method: 'post', url: '/inboxes', data},
        CreateInboxResponse
      )
    },
    deleteInbox(data: DeleteInboxRequest) {
      return axiosCallWithValidation(
        axiosInstance,
        {method: 'delete', url: '/inboxes', data},
        DeleteInboxResponse
      )
    },
    deletePulledMessages(data: DeletePulledMessagesResponse) {
      return axiosCallWithValidation(
        axiosInstance,
        {method: 'delete', url: '/inboxes/messages', data},
        DeletePulledMessagesResponse
      )
    },
    blockInbox(data: BlockInboxRequest) {
      return axiosCallWithValidation(
        axiosInstance,
        {method: 'put', url: '/inboxes/block', data},
        BlockInboxResponse
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
      return axiosCallWithValidation(
        axiosInstance,
        {method: 'post', url: '/inboxes/approval/confirm', data},
        ApproveRequestResponse
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
      return axiosCallWithValidation(
        axiosInstance,
        {method: 'put', url: '/inboxes/messages', data},
        RetrieveMessagesResponse
      )
    },
    sendMessage(data: SendMessageRequest) {
      return axiosCallWithValidation(
        axiosInstance,
        {method: 'post', url: '/inboxes/messages', data},
        SendMessageResponse
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
