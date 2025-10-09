import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {Schema} from 'effect/index'

const UserId = Schema.String.pipe(Schema.brand('UserId'))
type UserId = typeof UserId.Type

const Number = E164PhoneNumberE
type Number = typeof Number.Type

const User = Schema.Struct({
  id: UserId,
  number: Schema.String,
})

type Contact = {
  fromNumber: string
  toNumber: string
}

/**
 *
 * Operations needed.
 *
 * Find tokens of first level users
 */
