import {type JSDateString} from '@vexl-next/domain/dist/utility/JSDateString.brand'
import {DateTime} from 'luxon'

export function isOfferExpired(
  expirationDate: JSDateString | undefined
): boolean {
  return expirationDate
    ? DateTime.fromISO(expirationDate).startOf('day') <
        DateTime.now().startOf('day')
    : false
}
