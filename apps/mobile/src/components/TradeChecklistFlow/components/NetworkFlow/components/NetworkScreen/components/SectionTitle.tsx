import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {Text, XStack, getTokens, type StackProps} from 'tamagui'
import Image from '../../../../../../Image'

interface Props extends StackProps {
  text: string
  icon: SvgString
}

function SectionTitle({icon, text, ...props}: Props): JSX.Element {
  return (
    <XStack ai="center" gap="$2" mb="$4" {...props}>
      <Image
        source={icon}
        width={24}
        height={24}
        color={getTokens().color.white.val}
      />
      <Text fos={24} ff="$body600" col="$white">
        {text}
      </Text>
    </XStack>
  )
}

export default SectionTitle
