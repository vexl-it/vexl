import {Image, Stack} from '@vexl-next/ui'
import React from 'react'

function ClubAvatar({
  uri,
  size = 40,
}: {
  readonly uri: string
  readonly size?: number
}): React.JSX.Element {
  return (
    <Stack
      width={size}
      height={size}
      borderRadius="$3"
      overflow="hidden"
      backgroundColor="$accentYellowSecondary"
    >
      <Image source={{uri}} width="100%" height="100%" objectFit="cover" />
    </Stack>
  )
}

export default ClubAvatar
