import {focusAtom} from 'jotai-optics'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'

const vexlCalendarStorageAtom = atomWithParsedMmkvStorage(
  'vexlCalendar',
  {id: undefined},
  z
    .object({
      id: z.string().optional(),
    })
    .readonly()
)

export default vexlCalendarStorageAtom

export const vexlCalendarIdAtom = focusAtom(vexlCalendarStorageAtom, (o) =>
  o.prop('id')
)
