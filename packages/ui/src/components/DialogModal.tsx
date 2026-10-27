import React from 'react'
import {Modal} from 'react-native'

export function DialogModal({
  onRequestClose,
  children,
}: {
  readonly onRequestClose?: () => void
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={onRequestClose}
    >
      {children}
    </Modal>
  )
}
