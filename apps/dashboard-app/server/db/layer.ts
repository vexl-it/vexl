import {make as makePgClient, type PgClient} from '@effect/sql-pg/Client'
import {Context, Effect, Layer} from 'effect'
import {contactDatabaseConfig, userDatabaseConfig} from '../configs'

export interface PgContactClient extends PgClient {}
export const PgContactClient =
  Context.GenericTag<PgContactClient>('PgContactClient')

export const PgContactLive = Layer.scopedContext(
  contactDatabaseConfig.pipe(
    Effect.flatMap(makePgClient),
    Effect.map((client) => Context.make(PgContactClient, client))
  )
)

export interface PgUserClient extends PgClient {}
export const PgUserClient = Context.GenericTag<PgUserClient>('PgUserClient')

export const PgUserLive = Layer.scopedContext(
  userDatabaseConfig.pipe(
    Effect.flatMap(makePgClient),
    Effect.map((client) => Context.make(PgUserClient, client))
  )
)

export const DbsLive = Layer.merge(PgUserLive, PgContactLive)
