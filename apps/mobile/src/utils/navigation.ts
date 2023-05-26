// TODO how to type this properly?
import {type NavigationState} from 'react-native-tab-view'
import {ChatId} from '@vexl-next/domain/dist/general/messaging'
import {pipe} from 'fp-ts/function'
import {safeParse} from './fpUtils'
import * as O from 'fp-ts/Option'

function getActiveRoute(route: NavigationState<any>): any {
  if (
    !route.routes ||
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
  const activeRoute = getActiveRoute(state)
  return (
    activeRoute.name === 'ChatDetail' && activeRoute.params?.chatId === chatId
  )
}

export function getChatIdOfChatOnCurrentScreenIfAny(
  state: NavigationState<any>
): O.Option<ChatId> {
  return pipe(
    getActiveRoute(state).params?.chatId,
    safeParse(ChatId),
    O.fromEither
  )
}

export function isOnMessagesList(state: NavigationState<any>): boolean {
  const activeRoute = getActiveRoute(state)
  return activeRoute.name === 'Messages'
}
