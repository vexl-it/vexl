import {type Event} from '@vexl-next/rest-api/src/services/content/contracts'
import {type EventCardAttendee} from '@vexl-next/ui'
import dayjs from 'dayjs'
import {Option} from 'effect'
import {
  formatDate,
  formatTime,
  type FormattingLocale,
} from '../../../../../../utils/localization/formatting'

const BULLET = '•'

export function formatEventDate(
  event: Event,
  locale: FormattingLocale
): string {
  const startDate = dayjs(event.startDate)
  const formattedStartDate = formatDate(new Date(event.startDate), locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: startDate.isSame(dayjs(), 'year') ? undefined : 'numeric',
  })
  const formattedStartTime = formatTime(new Date(event.startDate), locale)

  return Option.match(event.endDate, {
    onNone: () => `${formattedStartDate} ${BULLET} ${formattedStartTime}`,
    onSome: (endDate) => {
      const formattedEndDate = dayjs(endDate)
      const endDateValue = new Date(endDate)

      if (formattedEndDate.isSame(startDate, 'day')) {
        return `${formattedStartDate} ${BULLET} ${formattedStartTime}-${formatTime(endDateValue, locale)}`
      }

      return `${formattedStartDate} - ${formatDate(endDateValue, locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })}`
    },
  })
}

export function toEventCardAttendee(
  speaker: Event['speakers'][number]
): EventCardAttendee {
  return Option.match(speaker.imageUrl, {
    onNone: () => ({
      id: speaker.name,
      name: speaker.name,
    }),
    onSome: (uri) => ({
      id: speaker.name,
      name: speaker.name,
      avatarSource: {uri},
    }),
  })
}
