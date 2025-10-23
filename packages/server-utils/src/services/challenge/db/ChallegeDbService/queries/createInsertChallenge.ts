import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Challenge} from '@vexl-next/rest-api/src/challenges/contracts'
import {Effect, flow, Schema} from 'effect'

const InsertChallengeParams = Schema.Struct({
  challenge: Challenge,
  publicKey: PublicKeyPemBase64E,
  createdAt: Schema.optionalWith(Schema.DateFromSelf, {
    default: () => new Date(),
  }),
  valid: Schema.optionalWith(Schema.Boolean, {default: () => true}),
})

export type InsertChallengeParams = typeof InsertChallengeParams.Type

export const createInsertChallenge = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const resolver = yield* _(
    SqlResolver.void('insertChallenge', {
      Request: InsertChallengeParams,
      execute: (params) => sql`
        INSERT INTO
          challenge ${sql.insert(params)}
      `,
    })
  )

  return flow(
    resolver.execute,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in insertChallenge', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('insertChallenge query')
  )
})
