import {InfoBox, type InfoBoxProps} from '@vexl-next/ui'
import React from 'react'
import useCommonErrorMessages, {
  type SomeError,
} from '../utils/useCommonErrorMessages'

type Props = {
  error?: SomeError
} & Omit<InfoBoxProps, 'children' | 'variant'>

export default function ErrorListHeader({
  error,
  ...rest
}: Props): React.ReactElement | null {
  const networkErrorMessage = useCommonErrorMessages({_tag: 'NetworkError'})

  if (!error || !networkErrorMessage) return null
  return (
    <InfoBox variant="error" {...rest}>
      {networkErrorMessage}
    </InfoBox>
  )
}
