import React from 'react'

import {Stack} from '../primitives'

/** On the web, dialogs cover their positioned ancestor (e.g. a phone mockup) instead of the whole page. */
export function DialogModal({
  children,
}: {
  readonly onRequestClose?: () => void
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <Stack position="absolute" top={0} left={0} right={0} bottom={0} zIndex={1}>
      {children}
    </Stack>
  )
}
