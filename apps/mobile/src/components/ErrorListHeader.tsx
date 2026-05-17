import {Stack, Typography} from '@vexl-next/ui'
import React, {useMemo, type ComponentProps} from 'react'
import useCommonErrorMessages from '../utils/useCommonErrorMessages'

type Props<T> = {
  topText?: string
  error?: T
  errorToMessage?: (error: T) => string | null
} & ComponentProps<typeof Stack>

export default function ErrorListHeader<T extends {_tag: string}>({
  error,
  topText,
  errorToMessage,
  ...rest
}: Props<T>): React.ReactElement | null {
  const commonErrorMessage = useCommonErrorMessages({
    _tag: 'NetworkError',
  } as const)

  const message = useMemo(() => {
    if (!error) return null

    const message = errorToMessage ? errorToMessage(error) : null
    return message ?? commonErrorMessage ?? null
  }, [commonErrorMessage, error, errorToMessage])

  if (!message) return null
  return (
    <Stack p="$4" backgroundColor="$redBackground" {...rest}>
      {!!topText && (
        <Typography color="$redForeground" variant="paragraphSmallBold">
          {topText}
        </Typography>
      )}
      <Typography
        textAlign="center"
        color="$redForeground"
        variant="paragraphSmall"
      >
        {message}
      </Typography>
    </Stack>
  )
}
