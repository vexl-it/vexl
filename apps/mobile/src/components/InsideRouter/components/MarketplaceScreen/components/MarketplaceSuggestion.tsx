import {getTokens, Stack, Text, XStack, YStack, type YStackProps} from 'tamagui'
import closeSvg from '../../../../images/closeSvg'
import {TouchableOpacity} from 'react-native'
import Image from '../../../../Image'
import bubbleTipSvg from '../../../../images/bubbleTipSvg'
import UserAvatar from '../../../../UserAvatar'
import Button from '../../../../Button'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import vexlerAvatarSvg from '../images/vexlerAvatarSvg'

interface Props extends YStackProps {
  buttonText: string
  type?: 'warning' | 'info'
  onButtonPress: () => void
  onClosePress?: () => void
  text: string
}

function MarketplaceSuggestion({
  buttonText,
  onButtonPress,
  onClosePress,
  type,
  text,
  ...props
}: Props): JSX.Element {
  const tokens = getTokens()
  const {t} = useTranslation()

  return (
    <YStack px="$2" {...props}>
      <Stack mb="$2">
        <Stack
          pos="relative"
          bc="$white"
          py="$6"
          pl="$6"
          pr="$7"
          br="$5"
        >
          {onClosePress && (
            <Stack pos="absolute" right={8} top={8}>
              <TouchableOpacity onPress={onClosePress}>
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
