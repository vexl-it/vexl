import {Effect, Option, Schema} from 'effect'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'

const vexlCalendarStorageAtom = atomWithParsedMmkvStorage(
  'vexlCalendar',
  {id: Option.none()},
  Schema.Struct({
    id: Schema.OptionFromOptional(Schema.String).pipe(
      Schema.withConstructorDefault(Effect.succeed(Option.none()))
    ),
  })
)

export default vexlCalendarStorageAtom

export const vexlCalendarIdAtom = focusAtom(vexlCalendarStorageAtom, (o) =>
  o.prop('id')
)
