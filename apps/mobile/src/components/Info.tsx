import {atom, useAtom, type PrimitiveAtom} from 'jotai'
import {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import Button from './Button'
import SvgImage from './Image'
import closeSvg from './images/closeSvg'
import infoSvg from './images/infoSvg'

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
        <XStack f={1} gap="$2" ai="center" mr="$1">
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
      {!!onActionPress && (
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
