import React from 'react'
import {Stack, Text} from 'tamagui'

interface Props {
  title: string
  subtitle?: string
}

function Header({title, subtitle}: Props): React.ReactElement {
  return (
    <Stack gap="$2" mt="$4" maw="80%">
      <Text fos={24} ff="$heading" col="$white">
        {title}
      </Text>
      {!!subtitle && (
        <Text fos={16} ff="$body500" col="$greyOnBlack">
          {subtitle}
        </Text>
      )}
    </Stack>
  )
}

export default Header
