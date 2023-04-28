import {z} from 'zod'
import {PageRequest, PageResponse} from '../../Pagination.brand'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {ConnectionLevel} from '@vexl-next/domain/dist/general/offers'

export interface InboxDoesNotExist {
  _tag: 'inboxDoesNotExist'
}

export interface NotPermittedToSendMessageToTargetInbox {
  _tag: 'notPermittedToSendMessageToTargetInbox'
}

export interface ImportListEmpty {
  _tag: 'ImportListEmpty'
}

export interface UserNotFoundError {
  _tag: 'UserNotFoundError'
}

export const CreateUserRequest = z.object({
  firebaseToken: z.string().nullable(),
})
export type CreateUserRequest = z.TypeOf<typeof CreateUserRequest>

export const RefreshUserRequest = z.object({
  offersAlive: z.boolean(),
})
export type RefreshUserRequest = z.TypeOf<typeof RefreshUserRequest>

export const UpdateFirebaseTokenRequest = z.object({
  firebaseToken: z.string().nullable(),
})
export type UpdateFirebaseTokenRequest = z.TypeOf<
  typeof UpdateFirebaseTokenRequest
>

const ImportContactsRequest = z.object({
  contacts: z.array(z.string()),
})
export type ImportContactsRequest = z.TypeOf<typeof ImportContactsRequest>

export const ImportContactsResponse = z.object({
  imported: z.boolean(),
  message: z.string(),
})
export type ImportContactsResponse = z.TypeOf<typeof ImportContactsResponse>

export const FetchMyContactsRequest = PageRequest.extend({
  level: ConnectionLevel,
})
export type FetchMyContactsRequest = z.TypeOf<typeof FetchMyContactsRequest>

export {ConnectionLevel}

export const FetchMyContactsResponse = PageResponse.extend({
  items: z.array(z.object({publicKey: PublicKeyPemBase64})),
})
export type FetchMyContactsResponse = z.TypeOf<typeof FetchMyContactsResponse>

export const FetchCommonConnectionsRequest = z.object({
  publicKeys: z.array(PublicKeyPemBase64),
})
export type FetchCommonConnectionsRequest = z.TypeOf<
  typeof FetchCommonConnectionsRequest
>

export const FetchCommonConnectionsResponse = z.object({
  commonContacts: z.array(
    z.object({
      publicKey: PublicKeyPemBase64,
      common: z.object({hashes: z.array(z.string())}),
    })
  ),
})
export type FetchCommonConnectionsResponse = z.TypeOf<
  typeof FetchCommonConnectionsResponse
>
