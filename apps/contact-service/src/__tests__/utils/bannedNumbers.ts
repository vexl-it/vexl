import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Effect} from 'effect'
import {NodeTestingInternalApp} from './NodeTestingApp'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const banNumbers = (phoneNumbers: readonly E164PhoneNumber[]) =>
  Effect.flatMap(NodeTestingInternalApp, (app) =>
    app.BannedNumbersAdmin.addBannedNumbers({
      payload: {
        numbers: Array.map(phoneNumbers, (phoneNumber) => ({phoneNumber})),
      },
    })
  )

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const unbanNumber = (phoneNumber: E164PhoneNumber) =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingInternalApp)
    const {items} = yield* _(
      app.BannedNumbersAdmin.listBannedNumbers({
        payload: {search: phoneNumber, limit: 1},
      })
    )
    const bannedNumber = yield* _(Array.head(items))
    yield* _(
      app.BannedNumbersAdmin.deleteBannedNumber({
        path: {id: bannedNumber.id},
      })
    )
  })
