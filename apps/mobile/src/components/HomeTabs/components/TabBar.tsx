import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {type BottomTabBarProps} from '@react-navigation/bottom-tabs'
import styled from '@emotion/native'
import Image from '../../Image'
import marketplaceIconSvg from '../images/marketplaceIconSvg'
import messagesIconSvg from '../images/messagesIconSvg'
import profileIconSvg from '../images/profileIconSvg'
import {type SvgString} from '@vexl-next/domain/dist/utility/SvgString.brand'

export const TAB_BAR_HEIGHT_PX = 72

const ContainerContainer = styled.View`
  position: absolute;
  left: 18px;
  right: 18px;
  height: ${TAB_BAR_HEIGHT_PX.toString()}px;
  align-items: center;
  justify-content: center;
`

const BlackBackgroundContainer = styled.View`
  background-color: ${(p) => p.theme.colors.black};
  border-radius: 20px;
  flex-direction: row;
  align-items: center;
  padding: 10px;
  max-width: 338px;
  flex: 1;
`

const IconTouchable = styled.TouchableWithoutFeedback`
  flex: 1;
`

const IconContainer = styled.View<{active: boolean}>`
  background-color: ${(p) => (p.active ? '#322916' : 'transparent')};
  height: 52px;
  flex: 1;
  border-radius: 16px;
  align-items: center;
  justify-content: center;
`
const IconImage = styled(Image)<{active: boolean}>`
  width: 24px;
  height: 24px;
  stroke: ${(p) =>
    p.active ? p.theme.colors.main : p.theme.colors.grayOnWhite};
`

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

function TabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): JSX.Element {
  const insets = useSafeAreaInsets()

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
    <ContainerContainer
      style={{
        bottom: insets.bottom,
      }}
    >
      <BlackBackgroundContainer>
        {state.routes.map((route, index) => {
          const iconSource = getIconForRouteName(route.name)

          const isFocused = state.index === index

          return (
            <IconTouchable
              onPress={() => {
                onPress(route)
              }}
              key={route.name}
            >
              <IconContainer active={isFocused}>
                <IconImage active={isFocused} source={iconSource} />
              </IconContainer>
            </IconTouchable>
          )
        })}
      </BlackBackgroundContainer>
    </ContainerContainer>
  )
}

export default TabBar
