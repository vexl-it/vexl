import {useMemo, type ComponentProps} from 'react'
import {Stack, Text} from 'tamagui'
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
}: Props<T>): JSX.Element | null {
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
    <Stack p="$4" backgroundColor="$darkRed" {...rest}>
      {topText && (
        <Text color="$red" fs={20}>
          {topText}
        </Text>
      )}
      <Text textAlign="center" color="$red">
        {message}
      </Text>
    </Stack>
  )
}
