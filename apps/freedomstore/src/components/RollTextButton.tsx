import React from 'react'

export function RollTextButton({
  variant,
  className,
  children,
}: {
  readonly variant: 'link' | 'blue'
  readonly className?: string
  readonly children: React.ReactNode
}): React.JSX.Element {
  if (variant === 'blue') {
    return (
      <span className={className ? `button-blue ${className}` : 'button-blue'}>
        <span className="button-text-03">{children}</span>
        <span className="button-text-03 is-text-absolute" aria-hidden="true">
          {children}
        </span>
      </span>
    )
  }
  return (
    <span
      className={className ? `button-block-19 ${className}` : 'button-block-19'}
    >
      <span className="button-text-02">{children}</span>
      <span className="button-text-02 is-absolute" aria-hidden="true">
        {children}
      </span>
    </span>
  )
}
