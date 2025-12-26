import {Option, Schema} from 'effect/index'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'

const vexlCalendarStorageAtom = atomWithParsedMmkvStorage(
  'vexlCalendar',
  {id: Option.none()},
  Schema.Struct({
    id: Schema.optionalWith(Schema.String, {as: 'Option'}),
  })
)

export default vexlCalendarStorageAtom

export const vexlCalendarIdAtom = focusAtom(vexlCalendarStorageAtom, (o) =>
  o.prop('id')
)
