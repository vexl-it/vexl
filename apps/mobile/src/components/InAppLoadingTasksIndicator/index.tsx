import {Option} from 'effect/index'
import {atom, useAtomValue} from 'jotai'
import React from 'react'
import {Text, XStack, YStack} from 'tamagui'
import {processingNotificationsAtom} from '../../state/notifications/NotificationProcessingReports'
import {activeLoadingTasksAtom} from '../../utils/inAppLoadingTasks'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {navigationRef} from '../../utils/navigation'
import {isDeveloperAtom} from '../../utils/preferences'
import VexlActivityIndicator from '../LoadingOverlayProvider/VexlActivityIndicator'

const activeNotificationsAtom = atom((get) => {
  const processingNotifications = get(processingNotificationsAtom)
  return processingNotifications.filter((notification) =>
    Option.isNone(notification.end)
  )
})

function InAppLoadingTasksIndicator(): React.ReactElement | null {
  const {t} = useTranslation()
  const {count, taskNames} = useAtomValue(activeLoadingTasksAtom)
  const isDeveloper = useAtomValue(isDeveloperAtom)
  const activeNotifications = useAtomValue(activeNotificationsAtom)
  const notificationCount = activeNotifications.length

  // Not shown to non developers
  if (!isDeveloper) return null

  if (!isDeveloper && count === 0 && notificationCount === 0) return null

  return (
    <YStack
      position="absolute"
      top={50}
      left={0}
      right={0}
      zIndex={1000}
      ai="center"
      pointerEvents={isDeveloper ? 'auto' : 'none'}
      pressStyle={isDeveloper ? {opacity: 0.7} : undefined}
      onPress={
        isDeveloper
          ? () => {
              navigationRef.navigate('TaskRegistryOverview')
            }
          : undefined
      }
    >
      <XStack
        bc="$black"
        opacity={0.8}
        px="$4"
        py="$2"
        br="$4"
        ai="center"
        gap="$3"
      >
        {count > 0 || notificationCount > 0 ? (
          <VexlActivityIndicator size="xsmall" />
        ) : (
          <Text>{t('common.noActiveTasks')}</Text>
        )}
        <YStack gap="$1">
          {count > 0 && (
            <Text fos={12} ff="$body500" col="$white">
              {t('common.loadingTasks', {count})}
            </Text>
          )}
          {notificationCount > 0 && (
            <Text fos={12} ff="$body500" col="$white">
              {t('common.processingNotifications', {count: notificationCount})}
            </Text>
          )}
        </YStack>
      </XStack>
      {isDeveloper &&
      (taskNames.length > 0 || activeNotifications.length > 0) ? (
        <YStack mt="$2" bc="$black" opacity={0.8} px="$4" py="$2" br="$4">
          {taskNames.map((name, index) => (
            <Text key={index} fos={10} ff="$body400" col="$greyOnBlack">
              • {name}
            </Text>
          ))}
          {activeNotifications.map((notification) => {
            const elapsedMs = Date.now() - notification.start
            const elapsedSeconds = (elapsedMs / 1000).toFixed(1)
            return (
              <Text
                key={notification.id}
                fos={10}
                ff="$body400"
                col="$greyOnBlack"
              >
                •{' '}
                {t('common.notificationWithType', {
                  type: notification.type,
                  time: elapsedSeconds,
                })}
              </Text>
            )
          })}
        </YStack>
      ) : null}
    </YStack>
  )
}

export default InAppLoadingTasksIndicator
