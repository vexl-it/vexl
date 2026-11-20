'use client'

import {copyToClipboard} from '@/src/services/clipboard'
import {useEffect, useState} from 'react'
import {Button, type ButtonSize, type ButtonVariant} from './Button'
import {CheckIcon, CopyIcon} from './icons'

type CopyState = 'idle' | 'copied' | 'failed'

const LABELS: Record<Exclude<CopyState, 'idle'>, string> = {
  copied: 'Copied',
  failed: 'Copy failed',
}

export function CopyButton({
  value,
  label = 'Copy',
  variant = 'secondary',
  size = 'sm',
}: {
  readonly value: string
  readonly label?: string
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
}) {
  const [state, setState] = useState<CopyState>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timeout = setTimeout(() => {
      setState('idle')
    }, 1500)
    return () => {
      clearTimeout(timeout)
    }
  }, [state])

  return (
    <Button
      variant={variant}
      size={size}
      icon={state === 'copied' ? <CheckIcon /> : <CopyIcon />}
      onClick={() => {
        copyToClipboard(value).then(
          () => {
            setState('copied')
          },
          () => {
            setState('failed')
          }
        )
      }}
    >
      {state === 'idle' ? label : LABELS[state]}
    </Button>
  )
}
