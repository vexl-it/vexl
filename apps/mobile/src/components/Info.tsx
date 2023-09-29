import {getTokens, Stack, Text, XStack} from 'tamagui'
import SvgImage from './Image'
import infoSvg from './images/infoSvg'
import {TouchableOpacity} from 'react-native'
import closeSvg from './images/closeSvg'
import Button from './Button'
import {useMemo} from 'react'
import {atom, type PrimitiveAtom, useAtom} from 'jotai'

interface Props {
  actionButtonText: string
  text: string
  onActionPress: () => void
  visibleStateAtom?: PrimitiveAtom<boolean>
}

function Info({
  actionButtonText,
  text,
  onActionPress,
  visibleStateAtom: nullableVisibleStateAtom,
}: Props): JSX.Element | null {
  const tokens = getTokens()

  const visibleStateAtom = useMemo(() => {
    return nullableVisibleStateAtom ?? atom(true)
  }, [nullableVisibleStateAtom])
  const [isVisible, setIsVisible] = useAtom(visibleStateAtom)

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
