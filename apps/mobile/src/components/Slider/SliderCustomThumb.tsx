import React from 'react'
import {Stack, type ColorTokens} from 'tamagui'

interface Props {
  customKnobColor?: ColorTokens
}

function SliderCustomThumb({customKnobColor}: Props): React.ReactElement {
  return (
    <Stack
      w={42}
      h={42}
      br={42}
      ai="center"
      jc="center"
      bc="$grey"
      bw={4}
      boc={customKnobColor ?? '$main'}
    >
      <Stack w={26} h={26} br={26} bc={customKnobColor ?? '$main'} />
    </Stack>
  )
}

export default SliderCustomThumb
