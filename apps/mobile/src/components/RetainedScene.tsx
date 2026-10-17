import {Stack} from '@vexl-next/ui'
import React, {createContext, useContext} from 'react'

const RetainedSceneActiveContext = createContext(true)

/** False inside a retained scene that is mounted but hidden. */
export const useIsRetainedSceneActive = (): boolean =>
  useContext(RetainedSceneActiveContext)

function RetainedScene({
  children,
  isActive,
}: {
  readonly children: React.ReactNode
  readonly isActive: boolean
}): React.ReactElement {
  return (
    <Stack
      position="absolute"
      top={0}
      right={0}
      bottom={0}
      left={0}
      opacity={isActive ? undefined : 0}
      pointerEvents={isActive ? undefined : 'none'}
      zIndex={isActive ? undefined : -1}
      aria-hidden={!isActive}
      importantForAccessibility={isActive ? 'auto' : 'no-hide-descendants'}
    >
      <RetainedSceneActiveContext.Provider value={isActive}>
        {children}
      </RetainedSceneActiveContext.Provider>
    </Stack>
  )
}

export default React.memo(RetainedScene)
