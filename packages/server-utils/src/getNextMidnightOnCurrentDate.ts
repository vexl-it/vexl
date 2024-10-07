import {DateTime} from 'luxon'

export default function getNextMidnightOnCurrentDate(): number {
  return DateTime.fromJSDate(new Date()).endOf('day').toMillis()
}
