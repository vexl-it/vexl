import {Option} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {FullscreenWarningComponent} from './components/FullscreenWarning'
import {
  fullScreenWarningDataAtom,
  isWarningClosedAtom,
  setCancelledIdActionAtom,
} from './state'

export function OverlayInfoScreen({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
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
