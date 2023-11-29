import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import {getTokens, Text, XStack} from 'tamagui'
import Image from '../../../../../../Image'

interface Props {
  text: string
  icon: SvgString
}

function SectionTitle({icon, text}: Props): JSX.Element {
  return (
    <XStack ai={'center'} space={'$2'} mb={'$4'}>
      <Image
        source={icon}
        width={24}
        height={24}
        color={getTokens().color.white.val}
      />
      <Text fos={24} ff={'$body600'} col={'$white'}>
        {text}
      </Text>
    </XStack>
  )
}

export default SectionTitle
