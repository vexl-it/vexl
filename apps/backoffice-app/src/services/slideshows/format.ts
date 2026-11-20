import {Array, pipe} from 'effect'
import {type SlideshowSlides} from './domain'

export const formatDuration = (totalSeconds: number): string =>
  pipe(
    [
      {value: Math.floor(totalSeconds / 3600), unit: 'h'},
      {value: Math.floor((totalSeconds % 3600) / 60), unit: 'min'},
      {value: totalSeconds % 60, unit: 's'},
    ],
    Array.filter(({value}) => value > 0),
    Array.map(({value, unit}) => `${value} ${unit}`),
    Array.join(' ')
  ) || '0 s'

export const loopSeconds = (slides: SlideshowSlides): number =>
  pipe(
    slides,
    Array.map(({durationSeconds}) =>
      Number.isFinite(durationSeconds) ? durationSeconds : 0
    ),
    Array.reduce(0, (total, seconds) => total + seconds)
  )

export const pluralize = (count: number, noun: string): string =>
  `${count} ${noun}${count === 1 ? '' : 's'}`

const dateFormat = new Intl.DateTimeFormat('en-GB', {dateStyle: 'medium'})
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export const formatDate = (isoDate: string): string =>
  dateFormat.format(new Date(isoDate))

export const formatDateTime = (isoDate: string): string =>
  dateTimeFormat.format(new Date(isoDate))
