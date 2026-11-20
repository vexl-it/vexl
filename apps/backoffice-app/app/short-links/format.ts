import {type ShortLink} from '@/src/services/shortLinks/domain'
import {Array, pipe} from 'effect'

/** Clicks over the days the API returns per link (the last 30). */
export const clicksInRange = (link: ShortLink): number =>
  pipe(
    link.dailyClicks,
    Array.reduce(0, (sum, {count}) => sum + count)
  )
