import React, {useEffect, useState} from 'react'

import {Stack} from '../primitives'
import {InfoBox} from './InfoBox'

const SHOW_AFTER_MS = 1000

export interface OffersReencryptionStatusProps {
  readonly startedAt: number | null
  readonly label: string
}

export function OffersReencryptionStatus({
  startedAt,
  label,
}: OffersReencryptionStatusProps): React.JSX.Element | null {
  const [visibleForStartedAt, setVisibleForStartedAt] = useState<number | null>(
    null
  )

  useEffect(() => {
    if (startedAt === null) return

    const timeout = setTimeout(
      () => {
        setVisibleForStartedAt(startedAt)
      },
      Math.max(0, SHOW_AFTER_MS - (Date.now() - startedAt))
    )
    return () => {
      clearTimeout(timeout)
    }
  }, [startedAt])

  if (startedAt === null || visibleForStartedAt !== startedAt) return null

  return (
    <Stack px="$5" pb="$4">
      <InfoBox
        loading
        gap="$3"
        px="$3"
        py="$3"
        borderRadius="$4"
        textMt={0}
        aria-live="polite"
        aria-busy
      >
        {label}
      </InfoBox>
    </Stack>
  )
}
