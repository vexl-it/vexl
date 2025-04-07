import {Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {useAppState} from '../../utils/useAppState'
import {FullscreenWarningComponent} from './components/FullscreenWarning'
import {
  fullScreenWarningDataAtom,
  isWarningClosedAtom,
  loadNewsAndAnnouncementsActionAtom,
  setCancelledIdActionAtom,
} from './state'

export function useLoadNewsAndAnnouncements(): void {
  const loadNewsAndAnnouncements = useSetAtom(
    loadNewsAndAnnouncementsActionAtom
  )
  useAppState(
    useCallback(
      (state) => {
        if (state !== 'active') return
        void loadNewsAndAnnouncements()
      },
      [loadNewsAndAnnouncements]
    )
  )
}

export function OverlayInfoScreen({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  const data = useAtomValue(fullScreenWarningDataAtom)
  const setCancelledIdAction = useSetAtom(setCancelledIdActionAtom)
  const isWarningClosed = useAtomValue(isWarningClosedAtom)

  if (Option.isNone(data)) return <>{children}</>

  if (isWarningClosed) {
    return <>{children}</>
  }

  return (
    <FullscreenWarningComponent
      onCancel={() => {
        setCancelledIdAction({id: data.value.id, temporary: true})
      }}
      data={data.value}
    />
  )
}
