import React from 'react'
import {Stack, type StackProps} from 'tamagui'
import backButtonSvg from '../../../images/backButtonSvg'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import IconButton from '../../IconButton'

function Header(props: StackProps): React.ReactElement {
  const goBack = useSafeGoBack()

  return (
    <Stack ai="flex-start" mx="$4" {...props}>
      <IconButton icon={backButtonSvg} variant="dark" onPress={goBack} />
    </Stack>
  )
}

export default Header
