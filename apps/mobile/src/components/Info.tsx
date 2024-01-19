import {getTokens, Stack, Text, XStack} from 'tamagui'
import SvgImage from './Image'
import infoSvg from './images/infoSvg'
import {TouchableOpacity} from 'react-native'
import closeSvg from './images/closeSvg'
import Button from './Button'
import {useMemo} from 'react'
import {atom, type PrimitiveAtom, useAtom} from 'jotai'

interface Props {
  actionButtonText?: string
  text: string
  onActionPress?: () => void
  hideCloseButton?: boolean
  visibleStateAtom?: PrimitiveAtom<boolean>
  variant?: 'pink' | 'yellow'
}

function Info({
  actionButtonText,
  text,
  onActionPress,
  hideCloseButton,
  visibleStateAtom: nullableVisibleStateAtom,
  variant = 'pink',
}: Props): JSX.Element | null {
  const tokens = getTokens()

  const visibleStateAtom = useMemo(() => {
    return nullableVisibleStateAtom ?? atom(true)
  }, [nullableVisibleStateAtom])
  const [isVisible, setIsVisible] = useAtom(visibleStateAtom)

  if (!isVisible) return null

  return (
    <Stack
      jc="center"
      p="$4"
      bc={variant === 'pink' ? '$pinkAccent1' : '$yellowAccent2'}
      br="$4"
    >
      <XStack ai="center" justifyContent="space-between">
        <XStack f={1} space="$2" ai="center" mr="$1">
          <SvgImage
            fill={
              variant === 'pink' ? tokens.color.pink.val : tokens.color.main.val
            }
            source={infoSvg}
          />
          <Stack fs={1}>
            <Text
              fos={14}
              col={variant === 'pink' ? '$pink' : '$main'}
              textAlign="justify"
            >
              {text}
            </Text>
          </Stack>
        </XStack>
        {!hideCloseButton && (
          <TouchableOpacity
            onPress={() => {
              setIsVisible(false)
            }}
          >
            <SvgImage stroke={tokens.color.pink.val} source={closeSvg} />
          </TouchableOpacity>
        )}
      </XStack>
      {onActionPress && (
        <Stack mt="$4">
          <Button
            text={actionButtonText}
            onPress={onActionPress}
            variant={variant === 'pink' ? 'hint' : 'primary'}
            size="medium"
          />
        </Stack>
      )}
    </Stack>
  )
}

export default Info
