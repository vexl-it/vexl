import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'
import {type Challenge} from '../../contracts'
import {type ChallengeRecord} from './domain'
import {createDeleteChallenge} from './queries/createDeleteChallenge'
import {createDeleteInvalidAndExpiredChallenges} from './queries/createDeleteInvalidAndExpiredChallenges'
import {
  createFindChallengeByChallengeAndPublicKey,
  type FindChallengeByChallengeAndPublicKey,
} from './queries/createFindChallengeByChallengeAndPublicKey'
import {
  createInsertChallenge,
  type InsertChallengeParams,
} from './queries/createInsertChallenge'
import {createUpdateChallengeInvalidate} from './queries/createUpdateChallengeInvalidate'

export interface ChallengeDbOperations {
  deleteInvalidAndExpiredChallenges: () => Effect.Effect<
    void,
    UnexpectedServerError
  >

  findChallengeByChallengeAndPublicKey: (
    args: FindChallengeByChallengeAndPublicKey
  ) => Effect.Effect<Option.Option<ChallengeRecord>, UnexpectedServerError>

  insertChallenge: (
    args: InsertChallengeParams
  ) => Effect.Effect<void, UnexpectedServerError>

  updateChallengeInvalidate: (
    args: Challenge
  ) => Effect.Effect<void, UnexpectedServerError>

  deleteChallenge: (
    args: Challenge
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class ChallengeDbService extends Context.Tag('ChallengeDbService')<
  ChallengeDbService,
  ChallengeDbOperations
>() {
  static readonly Live = Layer.effect(
    ChallengeDbService,
    Effect.gen(function* (_) {
      const deleteInvalidAndExpiredChallenges = yield* _(
        createDeleteInvalidAndExpiredChallenges
      )
      const findChallengeByChallengeAndPublicKey = yield* _(
        createFindChallengeByChallengeAndPublicKey
      )
      const insertChallenge = yield* _(createInsertChallenge)
      const updateChallengeInvalidate = yield* _(
        createUpdateChallengeInvalidate
      )
      const deleteChallenge = yield* _(createDeleteChallenge)

      return {
        deleteInvalidAndExpiredChallenges,
        findChallengeByChallengeAndPublicKey,
        insertChallenge,
        updateChallengeInvalidate,
        deleteChallenge,
      }
    })
  )
}
