import {make as makePgClient, type PgClient} from '@effect/sql-pg/PgClient'
import {Context, Effect, Layer} from 'effect'
import {contactDatabaseConfig} from '../configs'

export interface PgContactClient extends PgClient {}
export const PgContactClient =
  Context.GenericTag<PgContactClient>('PgContactClient')

export const PgContactLive = Layer.scopedContext(
  contactDatabaseConfig.pipe(
    Effect.flatMap(makePgClient),
    Effect.map((client) => Context.make(PgContactClient, client))
  )
)

export const DbsLive = PgContactLive
