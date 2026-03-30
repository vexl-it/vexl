import {Typography} from '@vexl-next/ui'
import React from 'react'
import {Stack} from 'tamagui'

interface Props {
  title: string
  subtitle?: string
}

function Header({title, subtitle}: Props): React.ReactElement {
  return (
    <Stack gap="$2" mt="$4" maw="80%">
      <Typography variant="heading2" color="$foregroundPrimary">
        {title}
      </Typography>
      {!!subtitle && (
        <Typography variant="paragraphSmall" color="$foregroundSecondary">
          {subtitle}
        </Typography>
      )}
    </Stack>
  )
}

export default Header
