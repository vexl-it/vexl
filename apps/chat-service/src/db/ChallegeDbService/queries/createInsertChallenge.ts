import {Schema} from '@effect/schema'
import {SqlResolver} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ChatChallengeE} from '@vexl-next/rest-api/src/services/chat/contracts'
import {Effect, flow} from 'effect'

const InsertChallengeParams = Schema.Struct({
  challenge: ChatChallengeE,
  publicKey: PublicKeyPemBase64E,
  createdAt: Schema.optionalWith(Schema.DateFromSelf, {
    default: () => new Date(),
  }),
  valid: Schema.optionalWith(Schema.Boolean, {default: () => true}),
})

export type InsertChallengeParams = Schema.Schema.Type<
  typeof InsertChallengeParams
>

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
