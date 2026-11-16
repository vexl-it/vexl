import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Option} from 'effect'
import {useAtomValue} from 'jotai'
import {useEffect, useState} from 'react'
import {quickConnectCooldownInputsAtom} from './atoms'
import {
  activePings,
  hasUsedAllCooldownSteps,
  nextPingAllowedAt,
} from './quickConnectCooldown'

export interface QuickConnectStatus {
  // Set while the user has to wait before asking someone else
  readonly cooldown: Option.Option<{
    readonly secondsLeft: number
    readonly lastTargetCommonFriendsCount: number
  }>
  readonly suggestClassicOffer: boolean
}

export function useQuickConnectStatus(): QuickConnectStatus {
  const inputs = useAtomValue(quickConnectCooldownInputsAtom)
  const [now, setNow] = useState(unixMillisecondsNow)
  const input = {...inputs, now}
  const pings = activePings(input)
  const allowedAt = nextPingAllowedAt(input)
  const isCoolingDown = Option.isSome(allowedAt)

  useEffect(() => {
    setNow(unixMillisecondsNow())
    // The series also expires on its own, so keep a slow tick outside the
    // countdown.
    const interval = setInterval(
      () => {
        setNow(unixMillisecondsNow())
      },
      isCoolingDown ? 1000 : 60_000
    )
    return () => {
      clearInterval(interval)
    }
  }, [isCoolingDown, inputs])

  return {
    cooldown: Option.map(allowedAt, (at) => ({
      secondsLeft: Math.ceil((at - now) / 1000),
      lastTargetCommonFriendsCount: pings?.lastTargetCommonFriendsCount ?? 0,
    })),
    suggestClassicOffer: hasUsedAllCooldownSteps(input),
  }
}
