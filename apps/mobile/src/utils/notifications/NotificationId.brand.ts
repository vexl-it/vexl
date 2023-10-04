import {z} from 'zod'

export const NotificationId = z.string().brand<'NotificationId'>()
export type NotificationId = z.TypeOf<typeof NotificationId>
