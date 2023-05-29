import {type E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import type * as E from 'fp-ts/Either'
import {
  type CryptoError,
  hmacSign,
} from '@vexl-next/resources-utils/dist/utils/crypto'

export function hashPhoneNumber(
  normalizedPhoneNumber: E164PhoneNumber
): E.Either<CryptoError, string> {
  return hmacSign('VexlVexl')(normalizedPhoneNumber)
}
