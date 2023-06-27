import {getTokens, Stack, Text, XStack} from 'tamagui'
import SvgImage from './Image'
import infoSvg from './images/infoSvg'
import {TouchableOpacity} from 'react-native'
import closeSvg from './images/closeSvg'
import Button from './Button'
import {useState} from 'react'

interface Props {
  actionButtonText: string
  text: string
  onActionPress: () => void
}

function Info({
  actionButtonText,
  text,
  onActionPress,
}: Props): JSX.Element | null {
  const tokens = getTokens()
  const [isVisible, setIsVisible] = useState<boolean>(true)

  if (!isVisible) return null

  return (
    <Stack jc={'center'} p={'$4'} bc={'$pinkAccent1'} br={'$4'}>
      <XStack ai={'center'} justifyContent={'space-between'} mb={'$4'}>
        <XStack f={1} space={'$2'} ai={'center'}>
          <SvgImage fill={tokens.color.pink.val} source={infoSvg} />
          <Stack fs={1}>
            <Text fos={14} col={'$pink'}>
              {text}
            </Text>
          </Stack>
        </XStack>
        <TouchableOpacity
          onPress={() => {
            setIsVisible(false)
          }}
        >
          <SvgImage stroke={tokens.color.pink.val} source={closeSvg} />
        </TouchableOpacity>
      </XStack>
      <Button
        text={actionButtonText}
        onPress={onActionPress}
        variant={'hint'}
        size={'medium'}
      />
    </Stack>
  )
}

export default Info
