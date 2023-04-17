import {z} from 'zod'

export const UserName = z.string().trim().min(1).brand<'UserName'>()
export type UserName = z.TypeOf<typeof UserName>
