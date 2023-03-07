import {z} from 'zod'
export interface ImportListEmpty {
  _tag: 'ImportListEmpty'
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
