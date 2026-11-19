import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Array, Effect} from 'effect'
import {NodeTestingInternalApp} from './NodeTestingApp'

export const adminHeaders = {'x-admin-token': 'dev'}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const banNumbers = (phoneNumbers: readonly E164PhoneNumber[]) =>
  Effect.flatMap(NodeTestingInternalApp, (app) =>
    app.BannedNumbersAdmin.addBannedNumbers({
      headers: adminHeaders,
      payload: {
        numbers: Array.map(phoneNumbers, (phoneNumber) => ({phoneNumber})),
      },
    })
  )
