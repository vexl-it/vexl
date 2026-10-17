import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Option, Record} from 'effect'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {clubsToKeyHolderAtom} from '../../state/clubs/atom/clubsToKeyHolderV2Atom'
import {useAppState} from '../useAppState'
import {reportActivityOnForegroundActionAtom} from './activity'
import {analyticsActionAtom} from './analyticsActionAtom'
import {analyticsMarkersAtom, setAnalyticsMarkersAtom} from './atoms'
import {startReactivationActionAtom} from './reactivation'
import {dormancyOnReturn} from './windows'

const reportForegroundActionAtom = analyticsActionAtom((get, set) => {
  const clubsCount = Record.size(get(clubsToKeyHolderAtom))
  const dormantFor = dormancyOnReturn(
    get(analyticsMarkersAtom).lastForegroundAt,
    new Date()
  )

  set(setAnalyticsMarkersAtom, (markers) => ({
    ...markers,
    lastForegroundAt: unixMillisecondsNow(),
  }))
  if (Option.isSome(dormantFor))
    set(startReactivationActionAtom, {
      dormantFor: dormantFor.value,
      clubMember: clubsCount > 0,
    })
  set(reportActivityOnForegroundActionAtom, {clubsCount})
})

/** Mount only while logged in: the activity rows and returns count logged-in use. */
export function useReportAnalyticsOnForeground(): void {
  const reportForeground = useSetAtom(reportForegroundActionAtom)

  useAppState(
    useCallback(
      (state) => {
        if (state === 'active') reportForeground()
      },
      [reportForeground]
    )
  )
}
