import {type BottomTabBarProps} from '@react-navigation/bottom-tabs'
import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {useAtom, useAtomValue} from 'jotai'
import {Fragment} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import {areThereUnreadMessagesAtom} from '../../../state/chat/atoms/unreadChatsCountAtom'
import {toggleMarketplaceLayoutModeActionAtom} from '../../../state/marketplace/atoms/map/marketplaceLayoutModeAtom'
import {areThereOffersToSeeInMarketplaceWithoutFiltersAtom} from '../../../state/marketplace/atoms/offersToSeeInMarketplace'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import Image from '../../Image'
import plusSvg from '../../images/plusSvg'
import listSvg from '../images/listSvg'
import mapSvg from '../images/mapSvg'
import marketplaceIconSvg from '../images/marketplaceIconSvg'
import messagesIconSvg from '../images/messagesIconSvg'
import profileIconSvg from '../images/profileIconSvg'
import settingsSvg from '../images/settingsSvg'
import tabBarPlusSvg from '../images/tabBarPlusSvg'

export const TAB_BAR_HEIGHT_PX = 72

function getIconForRouteName(routeName: string): SvgString {
  switch (routeName) {
    case 'Marketplace':
      return marketplaceIconSvg
    case 'MyOffers':
      return profileIconSvg
    case 'CreateOffer':
      return plusSvg
    case 'Messages':
      return messagesIconSvg
    case 'Settings':
      return settingsSvg
    default:
      throw new Error(`Unknown route name ${routeName}`)
  }
}

function TabBar({state, navigation}: BottomTabBarProps): JSX.Element {
  const {t} = useTranslation()
  const insets = useSafeAreaInsets()
  const tokens = getTokens()
  const areThereUnreadMessages = useAtomValue(areThereUnreadMessagesAtom)
  const [marketplaceLayoutMode, toggleMarketplaceLayoutMode] = useAtom(
    toggleMarketplaceLayoutModeActionAtom
  )
  const areThereOffersToSeeInMarketplaceWithoutFilters = useAtomValue(
    areThereOffersToSeeInMarketplaceWithoutFiltersAtom
  )

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
      <XStack
        f={1}
        ai="center"
        jc="space-between"
        br="$7"
        p="$3"
        maw={338}
        bg="$black"
      >
        {state.routes.map((route, index) => {
          const iconSource = getIconForRouteName(route.name)

          const isFocused = state.index === index
          const newMessageIndicator =
            route.name === 'Messages' && areThereUnreadMessages

          return (
            <Fragment key={route.name}>
              <TouchableWithoutFeedback
                onPress={() => {
                  onPress(route)
                }}
              >
                <Stack
                  f={1}
                  h={52}
                  ai="center"
                  jc="center"
                  br="$6"
                  bg={isFocused ? '$darkBrown' : 'transparent'}
                >
                  {!!newMessageIndicator && (
                    <Stack
                      backgroundColor="$main"
                      w={16}
                      h={16}
                      br={8}
                      position="absolute"
                      top="$2"
                      right="$2"
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
              {index === 1 && (
                <TouchableWithoutFeedback
                  onPress={() => {
                    navigation.navigate('CreateOffer')
                  }}
                >
                  <Stack
                    f={1}
                    h={52}
                    br="$6"
                    bc="$main"
                    ai="center"
                    jc="center"
                    mx="$2"
                  >
                    <Image
                      width={24}
                      height={24}
                      stroke={tokens.color.black.val}
                      source={tabBarPlusSvg}
                    />
                  </Stack>
                </TouchableWithoutFeedback>
              )}
            </Fragment>
          )
        })}
      </XStack>
      {/* display only on marketplace screen */}
      {state.index === 0 &&
        !!areThereOffersToSeeInMarketplaceWithoutFilters && (
          <Stack pos="absolute" b={80}>
            <TouchableWithoutFeedback onPress={toggleMarketplaceLayoutMode}>
              <XStack
                ai="center"
                jc="center"
                py="$3"
                px="$4"
                bc="$grey"
                br="$6"
                space="$2"
              >
                <Text fos={14} ff="$body600">
                  {marketplaceLayoutMode === 'map'
                    ? t('tabBar.showList')
                    : t('tabBar.map')}
                </Text>
                <Image
                  width={24}
                  height={24}
                  fill={tokens.color.white.val}
                  source={marketplaceLayoutMode === 'map' ? listSvg : mapSvg}
                />
              </XStack>
            </TouchableWithoutFeedback>
          </Stack>
        )}
    </Stack>
  )
}

export default TabBar
