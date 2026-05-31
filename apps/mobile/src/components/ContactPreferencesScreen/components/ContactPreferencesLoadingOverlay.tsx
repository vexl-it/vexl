import React from 'react'
import PreparingContactsOverlay from './PreparingContactsOverlay'

export default function ContactPreferencesLoadingOverlay({
  visible,
}: {
  readonly visible: boolean
}): React.ReactElement | null {
  return <PreparingContactsOverlay visible={visible} />
}
