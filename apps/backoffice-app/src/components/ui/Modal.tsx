'use client'

import {useLayoutEffect, useRef, type MouseEvent, type ReactNode} from 'react'
import {cx} from './cx'

export function useModalDialog(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null)

  useLayoutEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return ref
}

export const closeOnBackdropClick =
  (onClose: () => void) => (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  children,
}: {
  readonly open: boolean
  readonly onClose: () => void
  readonly title: ReactNode
  readonly description?: ReactNode
  readonly footer?: ReactNode
  readonly size?: 'md' | 'lg'
  readonly children?: ReactNode
}) {
  const ref = useModalDialog(open)

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={closeOnBackdropClick(onClose)}
      className={cx(
        'm-auto w-[calc(100%-2rem)] rounded-card bg-surface text-ink shadow-overlay backdrop:bg-ink/60',
        size === 'lg' ? 'max-w-2xl' : 'max-w-md'
      )}
    >
      <div className="px-6 pt-5 pb-4">
        <h2 className="font-display text-lg leading-snug tracking-[-0.03em]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        ) : null}
        {children ? <div className="mt-4 text-sm">{children}</div> : null}
      </div>
      {footer ? (
        <div className="flex flex-wrap justify-end gap-2 px-6 pt-1 pb-5">
          {footer}
        </div>
      ) : null}
    </dialog>
  )
}
