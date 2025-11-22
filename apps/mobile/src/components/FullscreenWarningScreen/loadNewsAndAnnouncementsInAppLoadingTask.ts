import {Effect} from 'effect/index'
import {registerInAppLoadingTask} from '../../utils/inAppLoadingTasks'
import {loadNewsAndAnnouncementsActionAtom} from './state'

export const loadNewsAndAnnouncementsInAppLoadingTask =
  registerInAppLoadingTask({
    name: 'loadNewsAndAnnouncements',
    requirements: {
      requiresUserLoggedIn: false,
      runOn: 'resume',
    },
    task: (store) =>
      Effect.gen(function* (_) {
        yield* _(store.set(loadNewsAndAnnouncementsActionAtom))
      }),
  })
