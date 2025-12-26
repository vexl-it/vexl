import {Schema} from 'effect'

export const NotificationCypher = Schema.String.pipe(
  Schema.brand('NotificationCypher')
)
export type NotificationCypher = typeof NotificationCypher.Type
