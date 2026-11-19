import {HttpApiBuilder} from '@effect/platform/index'
import {toE164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {BannedNumbersMonthlyLimitReachedError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactInternalApiSpecification} from '@vexl-next/rest-api/src/services/contact/internalSpecification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, Option} from 'effect'
import {bannedNumbersMonthlyLimitConfig} from '../../configs'
import {BannedNumberDbService} from '../../db/BannedNumberDbService'
import {serverHashE164PhoneNumber} from '../../utils/serverHashContact'
import {validateAdminToken} from '../../utils/validateAdminToken'

export const addBannedNumbers = HttpApiBuilder.handler(
  ContactInternalApiSpecification,
  'BannedNumbersAdmin',
  'addBannedNumbers',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.headers[HEADER_ADMIN_TOKEN]))

      const bannedNumberDb = yield* _(BannedNumberDbService)

      const numbersToBan = yield* _(
        req.payload.numbers,
        Array.map(({phoneNumber, note}) => {
          // Clients hash the canonical form, which a valid number written
          // with its national prefix (+44 0800...) is not.
          const canonicalPhoneNumber = Option.getOrElse(
            toE164PhoneNumber(phoneNumber),
            () => phoneNumber
          )
          return Effect.map(
            serverHashE164PhoneNumber(canonicalPhoneNumber),
            (hash) => ({
              phoneNumber: canonicalPhoneNumber,
              hash,
              note: note ?? null,
            })
          )
        }),
        Effect.allWith({concurrency: 'unbounded'})
      )

      const addedCount = yield* _(
        bannedNumberDb.insertBannedNumbers(numbersToBan)
      )

      // Inserting first counts only numbers that were not banned yet. The
      // transaction rolls the insert back when it goes over the limit.
      const monthlyLimit = yield* _(bannedNumbersMonthlyLimitConfig)
      const addedThisMonth = yield* _(
        bannedNumberDb.countBannedNumbersAddedThisMonth()
      )
      if (addedCount > 0 && addedThisMonth > monthlyLimit) {
        return yield* _(
          new BannedNumbersMonthlyLimitReachedError({
            monthlyLimit,
            remainingThisMonth: Math.max(
              0,
              monthlyLimit - (addedThisMonth - addedCount)
            ),
          })
        )
      }

      return {
        addedCount,
        alreadyBannedCount: numbersToBan.length - addedCount,
      }
    }).pipe(withDbTransaction, makeEndpointEffect)
)
