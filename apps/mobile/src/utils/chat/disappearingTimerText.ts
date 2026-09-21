import {type DisappearingTimerSeconds} from '@vexl-next/domain/src/general/messaging'
import {type TFunction} from '../localization/I18nProvider'
import {formatDecimal, type FormattingLocale} from '../localization/formatting'

const HOUR_SECONDS = 60 * 60
const DAY_SECONDS = 24 * HOUR_SECONDS

export function disappearingMessagesIndicator({
  timer,
  locale,
  t,
}: {
  timer: DisappearingTimerSeconds | undefined
  locale: FormattingLocale
  t: TFunction
}): {duration: string; accessibilityLabel: string} | undefined {
  return timer
    ? {
        duration: formatDisappearingTimerShort(timer, locale),
        accessibilityLabel: `${t('messages.disappearing.title')}: ${formatDisappearingTimer(timer, t)}`,
      }
    : undefined
}

export function formatDisappearingTimerShort(
  timer: DisappearingTimerSeconds,
  locale: FormattingLocale
): string {
  const unit =
    timer < HOUR_SECONDS ? 'second' : timer < DAY_SECONDS ? 'hour' : 'day'
  const divisor =
    unit === 'second' ? 1 : unit === 'hour' ? HOUR_SECONDS : DAY_SECONDS
  return formatDecimal(Math.round(timer / divisor), locale, {
    style: 'unit',
    unit,
    unitDisplay: 'narrow',
  }).replace(/\s/g, '')
}

export function formatDisappearingTimer(
  timer: DisappearingTimerSeconds | undefined,
  t: TFunction
): string {
  if (!timer) return t('messages.disappearing.off')
  // Only reachable with the debug timer available in hidden-features builds
  if (timer < HOUR_SECONDS) return `${timer}s`
  if (timer < DAY_SECONDS)
    return t('messages.disappearing.hours', {
      count: Math.round(timer / HOUR_SECONDS),
    })
  return t('messages.disappearing.days', {
    count: Math.round(timer / DAY_SECONDS),
  })
}

export function disappearingTimerUpdateText({
  timer,
  direction,
  name,
  t,
}: {
  timer: DisappearingTimerSeconds | undefined
  direction: 'incoming' | 'outgoing'
  name: string
  t: TFunction
}): string {
  return timer
    ? t(`messages.disappearing.${direction}.enabled`, {
        them: name,
        duration: formatDisappearingTimer(timer, t),
      })
    : t(`messages.disappearing.${direction}.disabled`, {them: name})
}
