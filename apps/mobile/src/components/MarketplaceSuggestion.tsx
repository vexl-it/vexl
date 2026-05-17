import {
  BubbleTip,
  Button,
  Stack,
  Typography,
  useTheme,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {AvatarBasic1} from '@vexl-next/ui/src/assets/anonymousAvatars/AvatarBasic1'
import {AvatarGolden1} from '@vexl-next/ui/src/assets/anonymousAvatars/AvatarGolden1'
import {atom, useAtom, useAtomValue, type WritableAtom} from 'jotai'
import React, {useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {type YStackProps} from 'tamagui'
import {useTranslation} from '../utils/localization/I18nProvider'
import {goldenAvatarTypeAtom} from '../utils/preferences'

interface Props extends YStackProps {
  buttonText?: string
  hideCloseButton?: boolean
  type?: 'warning' | 'info'
  onButtonPress: () => void
  text: string
  origin?: {
    title: string
    subtitle: string
  }
  visibleStateAtom?: WritableAtom<boolean, [visible: boolean], void>
}

function MarketplaceSuggestion({
  buttonText,
  hideCloseButton,
  onButtonPress,
  origin,
  type,
  text,
  visibleStateAtom: nullableVisibleStateAtom,
  ...props
}: Props): React.ReactElement | null {
  const theme = useTheme()
  const {t} = useTranslation()

  const visibleStateAtom = useMemo(() => {
    return nullableVisibleStateAtom ?? atom(true)
  }, [nullableVisibleStateAtom])
  const [isVisible, setIsVisible] = useAtom(visibleStateAtom)
  const goldenAvatarType = useAtomValue(goldenAvatarTypeAtom)

  if (!isVisible) return null

  return (
    <YStack {...props}>
      <Stack mb="$2">
        <XStack bc="$white100" p="$4" br="$5">
          <Typography f={1} fs={1} color="$black100" variant="paragraph">
            {text}
          </Typography>
          {!hideCloseButton && (
            <TouchableOpacity
              onPress={() => {
                setIsVisible(false)
              }}
            >
              <XmarkCancelClose
                color={theme.foregroundSecondary.get()}
                size={24}
              />
            </TouchableOpacity>
          )}
        </XStack>
        <Stack pos="absolute" b={-7} l={43}>
          <BubbleTip color={theme.white100.get()} size={25} />
        </Stack>
      </Stack>
      <XStack jc="space-between">
        <XStack f={1} mr="$2">
          <Stack width={48} height={48} borderRadius="$3" overflow="hidden">
            {goldenAvatarType ? (
              <AvatarGolden1 size={48} />
            ) : (
              <AvatarBasic1 size={48} />
            )}
          </Stack>
          <Stack fs={1} ml="$2" jc="center">
            <XStack fs={1} flexWrap="wrap">
              {origin ? (
                <Typography color="$white100" variant="paragraphSmallBold">
                  {origin.title}
                </Typography>
              ) : (
                <>
                  <Typography color="$white100" variant="paragraphSmallBold">
                    {t('suggestion.vexl')}
                  </Typography>
                  <Typography color="$white100" variant="paragraphSmallBold">
                    {' '}
                  </Typography>
                  {type === 'warning' ? (
                    <Typography
                      adjustsFontSizeToFit
                      numberOfLines={1}
                      color="$redForeground"
                      variant="paragraphSmallBold"
                    >
                      {t('suggestion.warns')}
                    </Typography>
                  ) : (
                    <Typography
                      adjustsFontSizeToFit
                      numberOfLines={1}
                      color="$accentYellowPrimary"
                      variant="paragraphSmallBold"
                    >
                      {t('suggestion.suggests')}
                    </Typography>
                  )}
                </>
              )}
            </XStack>
            <Typography
              adjustsFontSizeToFit
              numberOfLines={2}
              color="$foregroundSecondary"
              variant="description"
            >
              {origin ? origin.subtitle : t('suggestion.yourAppGuide')}
            </Typography>
          </Stack>
        </XStack>
        {!!buttonText && (
          <Stack maxWidth="70%">
            <Button
              size="medium"
              onPress={onButtonPress}
              variant={type === 'warning' ? 'destructive' : 'secondary'}
            >
              {buttonText}
            </Button>
          </Stack>
        )}
      </XStack>
    </YStack>
  )
}

export default MarketplaceSuggestion
