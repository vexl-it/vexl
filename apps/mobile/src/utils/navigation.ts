import {createNavigationContainerRef} from '@react-navigation/native'
import {ChatId} from '@vexl-next/domain/src/general/messaging'
import fastDeepEqual from 'fast-deep-equal'
import * as O from 'fp-ts/Option'
import {pipe} from 'fp-ts/function'
import {type NavigationState} from 'react-native-tab-view'
import {type RootStackParamsList} from '../navigationTypes'
import {safeParse} from './fpUtils'
import reportError from './reportError'

export const navigationRef = createNavigationContainerRef()

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
  state: NavigationState<any>,
  keys: RootStackParamsList['ChatDetail']
): boolean {
  try {
    const activeRoute = getActiveRoute(state)
    if (!activeRoute) return false
    return (
      activeRoute.name === 'ChatDetail' &&
      fastDeepEqual(activeRoute.params, keys)
    )
  } catch (e) {
    reportError('warn', new Error('Error in isOnSpecificChat'), {e})
    return false
  }
}

export function getChatIdOfChatOnCurrentScreenIfAny(
  state: NavigationState<any>
): O.Option<ChatId> {
  return pipe(
    O.tryCatch(() => {
      return getActiveRoute(state).params?.chatId
    }),
    O.chainEitherK(safeParse(ChatId))
  )
}

export function isOnMessagesList(state: NavigationState<any>): boolean {
  try {
    const activeRoute = getActiveRoute(state)
    return activeRoute.name === 'Messages'
  } catch (e) {
    reportError('warn', new Error('Error in isOnMessagesList'), {e})
    return false
  }
}
