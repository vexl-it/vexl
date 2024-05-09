import {atom, useAtom, type WritableAtom} from 'jotai'
import {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {getTokens, Stack, Text, XStack, YStack, type YStackProps} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import Image from '../../../../Image'
import bubbleTipSvg from '../../../../images/bubbleTipSvg'
import closeSvg from '../../../../images/closeSvg'
import UserAvatar from '../../../../UserAvatar'
import vexlerAvatarSvg from '../images/vexlerAvatarSvg'

interface Props extends YStackProps {
  buttonText: string
  hideCloseButton?: boolean
  type?: 'warning' | 'info'
  onButtonPress: () => void
  text: string
  visibleStateAtom?: WritableAtom<boolean, [visible: boolean], void>
}

function MarketplaceSuggestion({
  buttonText,
  hideCloseButton,
  onButtonPress,
  type,
  text,
  visibleStateAtom: nullableVisibleStateAtom,
  ...props
}: Props): JSX.Element | null {
  const tokens = getTokens()
  const {t} = useTranslation()

  const visibleStateAtom = useMemo(() => {
    return nullableVisibleStateAtom ?? atom(true)
  }, [nullableVisibleStateAtom])
  const [isVisible, setIsVisible] = useAtom(visibleStateAtom)

  if (!isVisible) return null

  return (
    <YStack px="$2" {...props}>
      <Stack mb="$2">
        <Stack pos="relative" bc="$white" py="$6" pl="$6" pr="$7" br="$5">
          {!hideCloseButton && (
            <Stack pos="absolute" right={8} top={8}>
              <TouchableOpacity
                onPress={() => {
                  setIsVisible(false)
                }}
              >
                <Image
                  stroke={tokens.color.greyOnWhite.val}
                  source={closeSvg}
                />
              </TouchableOpacity>
            </Stack>
          )}
          <Text col="$black" fos={20} ff="$body500">
            {text}
          </Text>
        </Stack>
        <Stack pos="absolute" b={-7} l={43}>
          <Image source={bubbleTipSvg} />
        </Stack>
      </Stack>
      <XStack jc="space-between">
        <XStack f={1} mr="$2">
          <UserAvatar
            userImage={{type: 'svgXml', svgXml: vexlerAvatarSvg}}
            width={48}
            height={48}
          />
          <Stack fs={1} ml="$2" jc="space-around">
            <XStack fs={1} flexWrap="wrap">
              <Text col="$white" fos={16} ff="$body600">
                {t('suggestion.vexl')}
              </Text>
              <Text> </Text>
              {type === 'warning' ? (
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  col="$red"
                  fos={16}
                  ff="$body600"
                >
                  {t('suggestion.warns')}
                </Text>
              ) : (
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  col="$main"
                  fos={16}
                  ff="$body600"
                >
                  {t('suggestion.suggests')}
                </Text>
              )}
            </XStack>
            <Text
              adjustsFontSizeToFit
              numberOfLines={2}
              fos={12}
              col="$greyOnBlack"
            >
              {t('suggestion.yourAppGuide')}
            </Text>
          </Stack>
        </XStack>
        <Stack maxWidth="70%">
          <Button
            numberOfLines={2}
            size="medium"
            text={buttonText}
            onPress={onButtonPress}
            variant={type === 'warning' ? 'redLight' : 'secondary'}
          />
        </Stack>
      </XStack>
    </YStack>
  )
}

export default MarketplaceSuggestion
