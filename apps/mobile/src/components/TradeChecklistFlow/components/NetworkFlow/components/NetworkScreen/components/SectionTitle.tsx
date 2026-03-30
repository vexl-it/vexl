import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {Typography} from '@vexl-next/ui'
import React from 'react'
import {getTokens, XStack, type XStackProps} from 'tamagui'
import Image from '../../../../../../Image'

interface Props extends XStackProps {
  text: string
  icon: SvgString
}

function SectionTitle({icon, text, ...props}: Props): React.ReactElement {
  return (
    <XStack ai="center" gap="$2" mb="$4" {...props}>
      <Image
        source={icon}
        width={24}
        height={24}
        color={getTokens().color.white.val}
      />
      <Typography variant="titlesSmall" color="$foregroundPrimary">
        {text}
      </Typography>
    </XStack>
  )
}

export default SectionTitle
