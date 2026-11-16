import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type QuickConnectPingCooldownStepsMinutes} from '@vexl-next/rest-api/src/services/user/contracts'
import {Array, Option, Schema} from 'effect'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const ONE_MINUTE_MS = 60 * 1000

export const QuickConnectPings = Schema.Struct({
  count: Schema.Int.pipe(Schema.positive()),
  firstPingAt: UnixMilliseconds,
  lastPingAt: UnixMilliseconds,
  lastTargetCommonFriendsCount: Schema.Int.pipe(Schema.nonNegative()),
})
export type QuickConnectPings = typeof QuickConnectPings.Type

export interface QuickConnectCooldownInput {
  readonly pings: QuickConnectPings | undefined
  // When someone last accepted one of my quick connect requests
  readonly lastAcceptedAt: number | undefined
  readonly now: UnixMilliseconds
}

// Pings in the current series. A series ends when someone accepts or after a
// day without pings.
export function activePings({
  pings,
  lastAcceptedAt,
  now,
}: QuickConnectCooldownInput): QuickConnectPings | undefined {
  if (!pings) return undefined
  if (now - pings.lastPingAt >= ONE_DAY_MS) return undefined
  if (lastAcceptedAt !== undefined && lastAcceptedAt >= pings.firstPingAt)
    return undefined
  return pings
}

// The cooldown grows with every ping, the last step repeats.
function cooldownMinutesAfter(
  pingCount: number,
  steps: QuickConnectPingCooldownStepsMinutes
): number {
  return Array.get(steps, pingCount - 1).pipe(
    Option.getOrElse(() => Array.lastNonEmpty(steps))
  )
}

export function nextPingAllowedAt(
  input: QuickConnectCooldownInput & {
    readonly steps: QuickConnectPingCooldownStepsMinutes
  }
): Option.Option<UnixMilliseconds> {
  return Option.fromNullable(activePings(input)).pipe(
    Option.map((pings) =>
      UnixMilliseconds.make(
        pings.lastPingAt +
          cooldownMinutesAfter(pings.count, input.steps) * ONE_MINUTE_MS
      )
    ),
    Option.filter((allowedAt) => allowedAt > input.now)
  )
}

// Once every step was used and nobody accepted, a classic offer is the better
// way to be found.
export function hasUsedAllCooldownSteps(
  input: QuickConnectCooldownInput & {
    readonly steps: QuickConnectPingCooldownStepsMinutes
  }
): boolean {
  return (activePings(input)?.count ?? 0) >= input.steps.length
}

export function recordPing(
  input: QuickConnectCooldownInput & {
    readonly targetCommonFriendsCount: number
  }
): QuickConnectPings {
  const current = activePings(input)
  return {
    count: (current?.count ?? 0) + 1,
    firstPingAt: current?.firstPingAt ?? input.now,
    lastPingAt: input.now,
    lastTargetCommonFriendsCount: input.targetCommonFriendsCount,
  }
}
