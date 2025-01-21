import day from 'dayjs'
import {Option} from 'effect'

const DATE_FORMAT = 'ddd, MMM D'
const DATE_FORMAT_YEAR = 'ddd, MMM D YYYY'
const TIME_FORMAT = 'HH:mm'
const BULLET = '•'

export default function EventDate({
  startDate,
  endDate,
  ...props
}: {
  startDate: Date
  endDate: Option.Option<Date>
}): string {
  const startDayjs = day(startDate)
  const startDateFormatted = startDayjs.format(
    startDayjs.isBefore(day().startOf('y')) ? DATE_FORMAT_YEAR : DATE_FORMAT
  )

  if (Option.isNone(endDate)) {
    const startTimeFormatted = startDayjs.format(TIME_FORMAT)
    return `${startDateFormatted} ${BULLET} ${startTimeFormatted}`
  }
  const endDayjs = day(endDate.value)

  if (endDayjs.isSame(startDayjs, 'day')) {
    const startTimeFormatted = startDayjs.format(TIME_FORMAT)
    const endTimeFormatted = endDayjs.format(TIME_FORMAT)
    return `${startDateFormatted} ${BULLET} ${startTimeFormatted}-${endTimeFormatted}`
  }

  const endDateFormatted = endDayjs.format(DATE_FORMAT)
  return `${startDateFormatted} - ${endDateFormatted}`
}
