// TODO how to type this properly?
import {type NavigationState} from 'react-native-tab-view'
import {ChatId} from '@vexl-next/domain/dist/general/messaging'
import {pipe} from 'fp-ts/function'
import {safeParse} from './fpUtils'
import * as O from 'fp-ts/Option'
import reportError from './reportError'

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
  chatId: ChatId
): boolean {
  try {
    const activeRoute = getActiveRoute(state)
    if (!activeRoute) return false
    return (
      activeRoute.name === 'ChatDetail' && activeRoute.params?.chatId === chatId
    )
  } catch (e) {
    reportError('warn', 'Error in isOnSpecificChat', e)
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
    reportError('warn', 'Error in isOnMessagesList', e)
    return false
  }
}
