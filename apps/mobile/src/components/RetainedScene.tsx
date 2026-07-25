import {Stack} from '@vexl-next/ui'
import React from 'react'

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
      {children}
    </Stack>
  )
}

export default React.memo(RetainedScene)
