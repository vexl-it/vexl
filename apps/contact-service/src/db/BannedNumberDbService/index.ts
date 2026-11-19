import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type BannedNumberId} from '@vexl-next/rest-api/src/services/contact/contracts'
import {Context, Effect, Layer} from 'effect'
import {createDeleteBannedNumber} from './queries/createDeleteBannedNumber'
import {
  createInsertBannedNumbers,
  type InsertBannedNumberParams,
} from './queries/createInsertBannedNumbers'
import {
  createListBannedNumbers,
  type BannedNumberListItem,
  type ListBannedNumbersParams,
} from './queries/createListBannedNumbers'

export interface BannedNumberDbOperations {
  /** Skips numbers that are already banned. Returns how many were inserted. */
  insertBannedNumbers: (
    numbers: readonly InsertBannedNumberParams[]
  ) => Effect.Effect<number, UnexpectedServerError>
  listBannedNumbers: (
    params: ListBannedNumbersParams
  ) => Effect.Effect<readonly BannedNumberListItem[], UnexpectedServerError>
  /** Returns whether a number with the id existed. */
  deleteBannedNumber: (
    id: BannedNumberId
  ) => Effect.Effect<boolean, UnexpectedServerError>
}

export class BannedNumberDbService extends Context.Tag('BannedNumberDbService')<
  BannedNumberDbService,
  BannedNumberDbOperations
>() {
  static readonly Live = Layer.effect(
    BannedNumberDbService,
    Effect.gen(function* (_) {
      const insertBannedNumbers = yield* _(createInsertBannedNumbers)
      const listBannedNumbers = yield* _(createListBannedNumbers)
      const deleteBannedNumber = yield* _(createDeleteBannedNumber)

      return {
        insertBannedNumbers,
        listBannedNumbers,
        deleteBannedNumber,
      }
    })
  )
}
