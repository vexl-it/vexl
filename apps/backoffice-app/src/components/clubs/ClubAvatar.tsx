'use client'

import {cx} from '@/src/components/ui'
import {useState} from 'react'

const SIZES = {
  md: 'size-9 text-sm',
  lg: 'size-20 text-2xl',
}

/** The club image, or the name's initial when there is none or it fails to load. */
export function ClubAvatar({
  src,
  name,
  size = 'md',
}: {
  readonly src: string
  readonly name: string
  readonly size?: keyof typeof SIZES
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const className = cx('shrink-0 rounded-[20%]', SIZES[size])

  return src && src !== failedSrc ? (
    <img
      src={src}
      alt=""
      onError={() => {
        setFailedSrc(src)
      }}
      className={cx(className, 'bg-canvas object-cover')}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cx(
        className,
        'flex items-center justify-center bg-accent-soft font-semibold text-accent-ink'
      )}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
