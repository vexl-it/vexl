import {
  bucketDormancy,
  dayOf,
  type DormancyBucket,
} from '@vexl-next/analytics-definitions/src/buckets'
import {Option} from 'effect'

const DAY_MS = 24 * 60 * 60 * 1000
const ACTIVATION_WINDOW_DAYS = 30
const DORMANT_AFTER_DAYS = 30

export type CoreActionWindow = 'coreActionD1' | 'coreActionD7' | 'coreActionD30'

export function isWithinActivationWindow(
  registeredAt: number,
  now: Date
): boolean {
  return now.getTime() - registeredAt < ACTIVATION_WINDOW_DAYS * DAY_MS
}

/** Retention windows count UTC days from the registration day. */
export function coreActionWindow(
  registeredAt: number,
  now: Date
): Option.Option<CoreActionWindow> {
  const days = Math.round(
    (Date.parse(dayOf(now)) - Date.parse(dayOf(new Date(registeredAt)))) /
      DAY_MS
  )
  if (days === 1) return Option.some('coreActionD1')
  if (days >= 7 && days <= 13) return Option.some('coreActionD7')
  if (days >= 28 && days <= 34) return Option.some('coreActionD30')
  return Option.none()
}

/** How long the install was away, when this foreground is a return. */
export function dormancyOnReturn(
  lastForegroundAt: number | undefined,
  now: Date
): Option.Option<DormancyBucket> {
  if (lastForegroundAt === undefined) return Option.none()
  const away = now.getTime() - lastForegroundAt
  return away >= DORMANT_AFTER_DAYS * DAY_MS
    ? Option.some(bucketDormancy(away))
    : Option.none()
}
