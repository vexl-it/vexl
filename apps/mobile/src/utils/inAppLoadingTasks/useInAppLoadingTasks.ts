import {Array, Effect, HashSet, Option, pipe} from 'effect/index'
import {useAtomValue, useStore} from 'jotai'
import {useCallback, useEffect, useRef} from 'react'
import {userLoggedInAtom} from '../../state/session'
import {useAppState} from '../useAppState'
import {executeTasksWithDependencies, taskRegistryAtom} from './index'

// tasks
import '../../components/FullscreenWarningScreen/loadNewsAndAnnouncementsInAppLoadingTask'
import '../../state/chat/checkAndDeleteEmptyInboxesWithoutOfferInAppLoadingTask'
import '../../state/chat/checkAndReportCurrentVersionToChatsInAppLoadingTask'
import '../../state/chat/decodePreviouslyUncompatibleMessagesInAppLoadingTask'
import '../../state/chat/fetchMessagesForAllInboxesInAppLoadingTask'
import '../../state/chat/refreshNotificationTokensForActiveChatsAssumeLoginLoadingTask'
import '../../state/clubs/cleanupRemovedClubsInAppLoadingTask'
import '../../state/connections/syncConnectionsInAppLoadingTask'
import '../../state/contacts/loadContactsFromDeviceActionAtomInAppLoadingTask'
import '../../state/marketplace/checkNotificationTokensAndVersionsAndUpdateOffersTask'
import '../../state/notifications/ensureVexlSecretExistsTask'
import '../../state/notifications/refreshVexlTokenMetadataTask'
import '../../state/refreshOffersAndEnsureInboxesInAppLoadingTask'
import '../../state/refreshUserOnContactServiceInAppBackgroundTask'
import '../../utils/notifications/refreshNotificationTokenOnResumeTask'

export const useInAppLoadingTasks = (): void => {
  const isLoggedIn = useAtomValue(userLoggedInAtom)
  const store = useStore()
  const requestedStartTaskIds = useRef(HashSet.empty<string>())

  // Run Start tasks on mount and when user logs in
  useEffect(() => {
    const taskRegistry = store.get(taskRegistryAtom)

    const startTasks = pipe(
      Array.fromIterable(taskRegistry),
      Array.filterMap(([taskId, task]) => {
        // Filter by trigger type
        if (task.requirements.runOn !== 'start') return Option.none()

        // Filter by login requirement
        if (task.requirements.requiresUserLoggedIn && !isLoggedIn)
          return Option.none()

        // Skip if already requested
        if (HashSet.has(requestedStartTaskIds.current, taskId))
          return Option.none()

        return Option.some(taskId)
      })
    )

    if (startTasks.length > 0) {
      console.log(
        'InAppLoadingTasks',
        `🎯 Running ${startTasks.length} Start tasks`
      )
      // Mark tasks as requested
      requestedStartTaskIds.current = pipe(
        startTasks,
        Array.reduce(requestedStartTaskIds.current, (acc, taskId) =>
          HashSet.add(acc, taskId)
        )
      )
      void Effect.runPromise(executeTasksWithDependencies(startTasks))
    }
  }, [store, isLoggedIn])

  useAppState(
    useCallback(
      (state) => {
        if (state !== 'active') return
        const taskRegistry = store.get(taskRegistryAtom)
        const resumeTasks = pipe(
          Array.fromIterable(taskRegistry),
          Array.filterMap(([taskId, task]) => {
            // Filter by trigger type
            if (task.requirements.runOn !== 'resume') return Option.none()

            // Filter by login requirement
            if (task.requirements.requiresUserLoggedIn && !isLoggedIn)
              return Option.none()

            return Option.some(taskId)
          })
        )

        if (resumeTasks.length > 0) {
          console.log(
            'InAppLoadingTasks',
            `🔄 Running ${resumeTasks.length} Resume tasks`
          )
          void Effect.runPromise(executeTasksWithDependencies(resumeTasks))
        }
      },
      [store, isLoggedIn]
    )
  )
}
