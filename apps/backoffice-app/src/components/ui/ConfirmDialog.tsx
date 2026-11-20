'use client'

import {useCallback, useState, type ReactNode} from 'react'
import {Button} from './Button'
import {Modal} from './Modal'

export interface ConfirmOptions {
  readonly title: ReactNode
  readonly message?: ReactNode
  readonly confirmLabel?: string
  readonly tone?: 'danger' | 'primary'
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmOptions & {
  readonly open: boolean
  readonly loading?: boolean
  readonly onConfirm: () => void
  readonly onCancel: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={message}
      footer={
        <>
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}

interface PendingConfirm {
  readonly options: ConfirmOptions
  readonly resolve: (confirmed: boolean) => void
}

/** A promise-based replacement for `window.confirm`; render `dialog` once. */
export function useConfirm() {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPending({options, resolve})
      }),
    []
  )

  const settle = (confirmed: boolean) => {
    pending?.resolve(confirmed)
    setPending(null)
  }

  const dialog = (
    <ConfirmDialog
      title=""
      {...pending?.options}
      open={pending !== null}
      onConfirm={() => {
        settle(true)
      }}
      onCancel={() => {
        settle(false)
      }}
    />
  )

  return {confirm, dialog}
}
