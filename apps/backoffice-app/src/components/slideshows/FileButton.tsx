import {
  buttonClassName,
  cx,
  type ButtonSize,
  type ButtonVariant,
} from '@/src/components/ui'
import {type ReactNode} from 'react'

/** A button that opens the file picker. */
export function FileButton({
  accept,
  multiple = false,
  variant,
  size,
  icon,
  onFiles,
  children,
}: {
  readonly accept: string
  readonly multiple?: boolean
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly icon?: ReactNode
  readonly onFiles: (files: readonly File[]) => void
  readonly children: ReactNode
}) {
  return (
    <label
      className={cx(
        buttonClassName({variant, size}),
        'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus'
      )}
    >
      {icon}
      {children}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          onFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />
    </label>
  )
}
