import {Brand, Schema} from 'effect'
import {z} from 'zod'

export const NotificationCypher = z
  .string()
  .includes('.')
  .transform((v) =>
    Brand.nominal<typeof v & Brand.Brand<'NotificationCypher'>>()(v)
  )

export const NotificationCypherE = Schema.String.pipe(
  Schema.brand('NotificationCypher')
)
export type NotificationCypher = Schema.Schema.Type<typeof NotificationCypherE>
