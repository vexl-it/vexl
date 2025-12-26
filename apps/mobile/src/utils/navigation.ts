import {createNavigationContainerRef} from '@react-navigation/native'
import {ChatId} from '@vexl-next/domain/src/general/messaging'
import {Option, Schema} from 'effect/index'
import {deepEqual} from 'fast-equals'
import {pipe} from 'fp-ts/function'
import {AppState} from 'react-native'
import {type NavigationState} from 'react-native-tab-view'
import {type RootStackParamsList} from '../navigationTypes'
import reportError from './reportError'

export const navigationRef = createNavigationContainerRef()

export function isPassedImportContactsOutsideReact(): boolean {
  const navigationState = navigationRef.getState()
  if (!navigationRef.isReady()) return false

  return (
    navigationState?.routeNames?.includes('InsideTabs') ||
    navigationState?.routes?.some((route) => route.name === 'InsideTabs')
  )
}

export function safeNavigateBackOutsideReact():
  | 'notReady'
  | 'wentBack'
  | 'wentHome' {
  if (!navigationRef.isReady()) {
    console.warn(
      'Trying to navigate back outside of react tree, but navigation ref is not ready yet.'
    )
    return 'notReady'
  }

  if (navigationRef.canGoBack()) {
    navigationRef.goBack()
    return 'wentBack'
  } else {
    navigationRef.navigate('InsideTabs', {screen: 'Marketplace'})
    return 'wentHome'
  }
}

export function getActiveRouteNameOutsideOfReact(): string | undefined {
  if (!navigationRef.isReady()) {
    console.warn(
      'Trying to get active route name outside of react tree, but navigation ref is not ready yet.'
    )
    return undefined
  }
  const route = navigationRef.getCurrentRoute()
  return route?.name
}

function getActiveRoute(route: NavigationState<any>): any | null {
  if (!route) return null

  if (
    !route?.routes ||
    route.routes.length === 0 ||
    route.index >= route.routes.length
  ) {
    return route
  }

  const childActiveRoute = route.routes[route.index] as NavigationState<any>
  return getActiveRoute(childActiveRoute)
}

export function isOnSpecificChat(
  keys: RootStackParamsList['ChatDetail']
): boolean {
  if (AppState.currentState !== 'active') return false
  if (!navigationRef.isReady()) return false

  const state = navigationRef.getState()
  if (!state) return false

  try {
    const activeRoute = getActiveRoute(state)
    if (!activeRoute) return false

    return (
      activeRoute.name === 'ChatDetail' && deepEqual(activeRoute.params, keys)
    )
  } catch (e) {
    reportError('warn', new Error('Error in isOnSpecificChat'), {e})
    return false
  }
}

export function getChatIdOfChatOnCurrentScreenIfAny(
  state: NavigationState<any>
): Option.Option<ChatId> {
  return pipe(
    getActiveRoute(state).params?.chatId,
    Option.fromNullable,
    Schema.decodeUnknownOption(ChatId)
  )
}

export function isOnMessagesList(
  state: NavigationState<any> | undefined
): boolean {
  if (!state) return false

  try {
    const activeRoute = getActiveRoute(state)
    return activeRoute.name === 'Messages'
  } catch (e) {
    reportError('warn', new Error('Error in isOnMessagesList'), {e})
    return false
  }
}
