import {useAtomValue} from 'jotai'
import {RefreshControl, ScrollView} from 'react-native'
import {Stack, YStack, getTokens} from 'tamagui'
import {goldenAvatarTypeAtom} from '../utils/preferences'
import Button from './Button'
import Image from './Image'
import usePixelsFromBottomWhereTabsEnd from './InsideRouter/utils'
import anonymousAvatarHappyGoldenGlassesNoBackgroundSvg from './images/anonymousAvatarHappyGoldenGlassesNoBackgroundSvg'
import anonymousAvatarHappyNoBackgroundSvg from './images/anonymousAvatarHappyNoBackgroundSvg'

interface ContentProps {
  buttonText?: string | undefined
  children: React.ReactNode
  onButtonPress?: () => void
}

function EmptyListContent({
  children,
  buttonText,
  onButtonPress,
}: ContentProps): JSX.Element {
  const goldenAvatarType = useAtomValue(goldenAvatarTypeAtom)

  return (
    <YStack f={1} ai="center" jc="center" py="$4" gap="$4">
      <Stack ai="center" jc="center" p="$2" bc="$grey" br="$6">
        <Image
          source={
            goldenAvatarType
              ? anonymousAvatarHappyGoldenGlassesNoBackgroundSvg
              : anonymousAvatarHappyNoBackgroundSvg
          }
        />
      </Stack>
      {children}
      {!!buttonText && !!onButtonPress && (
        <Button
          text={buttonText}
          variant="primary"
          size="small"
          onPress={onButtonPress}
        />
      )}
    </YStack>
  )
}

interface Props extends ContentProps {
  inScrollView?: boolean
  refreshing?: boolean | undefined
  onRefresh?: () => void
}

function EmptyListWrapper({
  buttonText,
  children,
  inScrollView,
  onButtonPress,
  refreshing = false,
  onRefresh,
}: Props): JSX.Element {
  const tabBarEndsAt = usePixelsFromBottomWhereTabsEnd()

  return inScrollView ? (
    <ScrollView
      indicatorStyle="white"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={getTokens().color.greyAccent5.val}
        />
      }
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        paddingBottom: tabBarEndsAt,
      }}
    >
      <EmptyListContent buttonText={buttonText} onButtonPress={onButtonPress}>
        {children}
      </EmptyListContent>
    </ScrollView>
  ) : (
    <Stack f={1} ai="center" jc="center">
      <EmptyListContent buttonText={buttonText} onButtonPress={onButtonPress}>
        {children}
      </EmptyListContent>
    </Stack>
  )
}

export default EmptyListWrapper
