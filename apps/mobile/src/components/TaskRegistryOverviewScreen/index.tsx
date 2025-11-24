import Clipboard from '@react-native-clipboard/clipboard'
import {Array, Option, pipe} from 'effect'
import {useAtomValue, useStore} from 'jotai'
import React, {useState} from 'react'
import {ScrollView, TouchableOpacity} from 'react-native'
import {Spacer, Text, XStack, YStack} from 'tamagui'
import {processingNotificationsAtom} from '../../state/notifications/NotificationProcessingReports'
import {taskRegistryAtom} from '../../utils/inAppLoadingTasks/atoms'
import {
  type InAppLoadingTask,
  type InAppLoadingTaskId,
} from '../../utils/inAppLoadingTasks/domain'
import useSafeGoBack from '../../utils/useSafeGoBack'
import Button from '../Button'
import Screen from '../Screen'
import WhiteContainer from '../WhiteContainer'

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

interface TaskCardProps {
  id: InAppLoadingTaskId
  task: InAppLoadingTask
}

function TaskCard({id, task}: TaskCardProps): React.ReactElement {
  const {status, name, requirements} = task

  let statusColor = '$black'
  let statusText = 'Not Started'
  let durationText = ''

  if (status._tag === 'pending') {
    statusColor = '$main'
    statusText = 'Running'
    const duration = Date.now() - status.startedAt
    durationText = `(${formatDuration(duration)})`
  } else if (status._tag === 'completed') {
    statusColor = '$green'
    statusText = 'Completed'
    const duration = status.finishedAt - status.startedAt
    durationText = `(${formatDuration(duration)})`
    if (duration > 1000) {
      statusColor = '$red'
    }
  } else if (status._tag === 'failed') {
    statusColor = '$red'
    statusText = 'Failed'
    const duration = status.finishedAt - status.startedAt
    durationText = `(${formatDuration(duration)})`
  }

  return (
    <YStack
      key={id}
      paddingVertical="$2"
      paddingHorizontal="$3"
      bc="$white"
      borderRadius="$2"
      borderWidth={1}
      borderColor="$greyAccent2"
      gap="$1"
    >
      <Text color={statusColor} fontWeight="bold">
        {statusText} {durationText}
      </Text>
      <Text color="$black" fontSize={14} fontWeight="600">
        {name}
      </Text>
      <Text color="$grey" fontSize={12}>
        Runs on: {requirements.runOn} | Requires login:{' '}
        {requirements.requiresUserLoggedIn ? 'Yes' : 'No'}
      </Text>
      {status._tag === 'failed' && Boolean(status.error.message) && (
        <Text color="$red" fontSize={12}>
          Error: {status.error.message}
        </Text>
      )}
      {Boolean(task.dependsOn?.length) && (
        <Text color="$grey" fontSize={12}>
          Depends on: {task.dependsOn?.map((d) => d.id).join(', ')}
        </Text>
      )}
    </YStack>
  )
}

interface NotificationCardProps {
  id: string
  type: 'hook' | 'handler'
  start: number
  end: Option.Option<number>
  notificationData?: unknown
}

function NotificationCard({
  id,
  type,
  start,
  end,
  notificationData,
}: NotificationCardProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false)
  const isInProgress = Option.isNone(end)
  const duration = isInProgress ? Date.now() - start : end.value - start
  const durationColor = isInProgress
    ? '$main'
    : duration > 1000
      ? '$red'
      : '$green'

  return (
    <TouchableOpacity
      onPress={() => {
        setIsExpanded(!isExpanded)
      }}
    >
      <YStack
        paddingVertical="$2"
        paddingHorizontal="$3"
        bc="$white"
        borderRadius="$2"
        borderWidth={1}
        borderColor="$greyAccent2"
        gap="$1"
      >
        <XStack justifyContent="space-between">
          <Text color={durationColor} fontWeight="bold">
            {type}
          </Text>
          <XStack gap="$2" alignItems="center">
            <Text color={durationColor}>{formatDuration(duration)}</Text>
            <Text color="$grey" fontSize={12}>
              {isExpanded ? '▼' : '▶'}
            </Text>
          </XStack>
        </XStack>
        <Text color="$grey" fontSize={12}>
          ID: {id}
        </Text>
        {!!isExpanded && notificationData !== undefined && (
          <YStack
            paddingVertical="$2"
            paddingHorizontal="$2"
            borderRadius="$1"
            marginTop="$1"
          >
            <Text color="$grey" fontSize={11}>
              {JSON.stringify(notificationData, null, 2)}
            </Text>
          </YStack>
        )}
      </YStack>
    </TouchableOpacity>
  )
}

function TaskRegistrySection(): React.ReactElement {
  const registry = useAtomValue(taskRegistryAtom)

  const tasks = pipe(
    Array.fromIterable(registry),
    Array.map(([id, task]) => ({id, task}))
  )

  const pendingTasks = tasks.filter((t) => t.task.status._tag === 'pending')
  const completedTasks = tasks.filter((t) => t.task.status._tag === 'completed')
  const failedTasks = tasks.filter((t) => t.task.status._tag === 'failed')
  const notStartedTasks = tasks.filter(
    (t) => t.task.status._tag === 'notStartedYet'
  )

  return (
    <YStack gap="$2">
      <Text color="$black" fontSize={18} fontWeight="bold">
        Task Registry ({tasks.length} total)
      </Text>

      {pendingTasks.length > 0 && (
        <YStack gap="$1">
          <Text color="$main" fontWeight="bold">
            Running ({pendingTasks.length})
          </Text>
          {pendingTasks.map((t) => (
            <TaskCard key={t.id} id={t.id} task={t.task} />
          ))}
        </YStack>
      )}

      {failedTasks.length > 0 && (
        <YStack gap="$1">
          <Text color="$red" fontWeight="bold">
            Failed ({failedTasks.length})
          </Text>
          {failedTasks.map((t) => (
            <TaskCard key={t.id} id={t.id} task={t.task} />
          ))}
        </YStack>
      )}

      {completedTasks.length > 0 && (
        <YStack gap="$1">
          <Text color="$green" fontWeight="bold">
            Completed ({completedTasks.length})
          </Text>
          {completedTasks.map((t) => (
            <TaskCard key={t.id} id={t.id} task={t.task} />
          ))}
        </YStack>
      )}

      {notStartedTasks.length > 0 && (
        <YStack gap="$1">
          <Text color="$greyOnBlack" fontWeight="bold">
            Not Started ({notStartedTasks.length})
          </Text>
          {notStartedTasks.map((t) => (
            <TaskCard key={t.id} id={t.id} task={t.task} />
          ))}
        </YStack>
      )}
    </YStack>
  )
}

function NotificationProcessingSection(): React.ReactElement {
  const notifications = useAtomValue(processingNotificationsAtom)

  const completed = notifications.filter((n) => Option.isSome(n.end))
  const inProgress = notifications.filter((n) => Option.isNone(n.end))

  return (
    <YStack gap="$2">
      <Text color="$black" fontSize={18} fontWeight="bold">
        Notification Processing ({notifications.length} total)
      </Text>

      {inProgress.length > 0 && (
        <YStack gap="$1">
          <Text color="$main" fontWeight="bold">
            In Progress ({inProgress.length})
          </Text>
          {inProgress.map((notification) => (
            <NotificationCard
              key={notification.id}
              id={notification.id}
              type={notification.type}
              start={notification.start}
              end={notification.end}
              notificationData={notification.notificationData}
            />
          ))}
        </YStack>
      )}

      {completed.length > 0 && (
        <YStack gap="$1">
          <Text color="$green" fontWeight="bold">
            Completed ({completed.length})
          </Text>
          {completed.map((notification) => (
            <NotificationCard
              key={notification.id}
              id={notification.id}
              type={notification.type}
              start={notification.start}
              end={notification.end}
              notificationData={notification.notificationData}
            />
          ))}
        </YStack>
      )}

      {notifications.length === 0 && (
        <Text color="$grey">No notification processing reports</Text>
      )}
    </YStack>
  )
}

export default function TaskRegistryOverviewScreen(): React.ReactElement {
  const safeGoBack = useSafeGoBack()
  const store = useStore()

  return (
    <Screen>
      <WhiteContainer>
        <ScrollView>
          <YStack gap="$4">
            <Text color="$black" fontSize={20} fontWeight="bold">
              Task Registry Overview
            </Text>

            <TaskRegistrySection />

            <Spacer />

            <NotificationProcessingSection />

            <Spacer />

            <YStack gap="$2">
              <Button
                variant="primary"
                size="small"
                text="Copy Task Registry JSON"
                onPress={() => {
                  const registry = store.get(taskRegistryAtom)
                  const tasks = pipe(
                    Array.fromIterable(registry),
                    Array.map(([id, task]) => ({
                      id,
                      name: task.name,
                      status: task.status,
                      requirements: task.requirements,
                      dependsOn: task.dependsOn,
                    }))
                  )
                  Clipboard.setString(JSON.stringify(tasks, null, 2))
                }}
              />

              <Button
                variant="primary"
                size="small"
                text="Copy Notification Reports JSON"
                onPress={() => {
                  const notifications = store.get(processingNotificationsAtom)
                  const formatted = notifications.map((n) => ({
                    id: n.id,
                    type: n.type,
                    start: n.start,
                    end: Option.isSome(n.end) ? n.end.value : null,
                    duration: Option.isSome(n.end)
                      ? n.end.value - n.start
                      : null,
                  }))
                  Clipboard.setString(JSON.stringify(formatted, null, 2))
                }}
              />

              <Button variant="secondary" text="Back" onPress={safeGoBack} />
            </YStack>
          </YStack>
        </ScrollView>
      </WhiteContainer>
    </Screen>
  )
}
