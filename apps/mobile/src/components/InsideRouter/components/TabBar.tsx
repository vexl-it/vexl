import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {type BottomTabBarProps} from '@react-navigation/bottom-tabs'
import Image from '../../Image'
import marketplaceIconSvg from '../images/marketplaceIconSvg'
import messagesIconSvg from '../images/messagesIconSvg'
import profileIconSvg from '../images/profileIconSvg'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'
import {getTokens, Stack, XStack} from 'tamagui'
import {TouchableWithoutFeedback} from 'react-native'
import {useAtomValue} from 'jotai'
import {areThereUnreadMessagesAtom} from '../../../state/chat/atoms/unreadChatsCountAtom'

export const TAB_BAR_HEIGHT_PX = 72

function getIconForRouteName(routeName: string): SvgString {
  switch (routeName) {
    case 'Marketplace':
      return marketplaceIconSvg
    case 'Messages':
      return messagesIconSvg
    case 'Settings':
      return profileIconSvg
    default:
      throw new Error(`Unknown route name ${routeName}`)
  }
}

function TabBar({state, navigation}: BottomTabBarProps): JSX.Element {
  const insets = useSafeAreaInsets()
  const tokens = getTokens()
  const areThereUnreadMessages = useAtomValue(areThereUnreadMessagesAtom)

  function onPress({key, name}: {key: string; name: string}): void {
    const event = navigation.emit({
      type: 'tabPress',
      target: key,
      canPreventDefault: true,
    })

    if (!event.defaultPrevented) {
      navigation.navigate(name)
    }
  }

  return (
    <Stack
      pos="absolute"
      ai="center"
      jc="center"
      l="$4"
      r="$4"
      b={insets.bottom}
      h={TAB_BAR_HEIGHT_PX}
    >
      <XStack f={1} ai="center" br="$7" p="$3" maw={338} bg="$black">
        {state.routes.map((route, index) => {
          const iconSource = getIconForRouteName(route.name)

          const isFocused = state.index === index
          const newMessageIndicator =
            route.name === 'Messages' && areThereUnreadMessages

          return (
            <TouchableWithoutFeedback
              onPress={() => {
                onPress(route)
              }}
              key={route.name}
            >
              <Stack
                f={1}
                h={52}
                ai="center"
                jc="center"
                br="$6"
                bg={isFocused ? '$darkBrown' : 'transparent'}
              >
                {newMessageIndicator && (
                  <Stack
                    backgroundColor={'$main'}
                    w={16}
                    h={16}
                    br={8}
                    position={'absolute'}
                    top={'$2'}
                    right={'$2'}
                  />
                )}
                <Stack w={24} h={24}>
                  <Image
                    stroke={
                      isFocused
                        ? tokens.color.main.val
                        : tokens.color.greyOnWhite.val
                    }
                    source={iconSource}
                  />
                </Stack>
              </Stack>
            </TouchableWithoutFeedback>
          )
        })}
      </XStack>
    </Stack>
  )
}

export default TabBar
