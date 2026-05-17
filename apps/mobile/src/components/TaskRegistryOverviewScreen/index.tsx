import Clipboard from '@react-native-clipboard/clipboard'
import {
  Button,
  ChevronLeft,
  NavigationBar,
  Screen,
  Stack,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {Array, Option, pipe} from 'effect'
import {useAtomValue, useStore} from 'jotai'
import React, {useState} from 'react'
import {processingNotificationsAtom} from '../../state/notifications/NotificationProcessingReports'
import {taskRegistryAtom} from '../../utils/inAppLoadingTasks/atoms'
import {
  type InAppLoadingTask,
  type InAppLoadingTaskId,
} from '../../utils/inAppLoadingTasks/domain'
import useSafeGoBack from '../../utils/useSafeGoBack'

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

type TypographyColor = React.ComponentProps<typeof Typography>['color']

interface TaskEntry {
  readonly id: InAppLoadingTaskId
  readonly task: InAppLoadingTask
}

interface StatusViewState {
  readonly color: TypographyColor
  readonly text: string
  readonly durationText: string
}

interface TaskCardProps {
  id: InAppLoadingTaskId
  task: InAppLoadingTask
}

function TaskCard({id, task}: TaskCardProps): React.ReactElement {
  const {status, name, requirements} = task
  const dependencyIds = pipe(
    task.dependsOn ?? [],
    Array.map((dependency) => dependency.id),
    Array.join(', ')
  )

  const statusState: StatusViewState =
    status._tag === 'pending'
      ? {
          color: '$accentHighlightSecondary',
          text: 'Running',
          durationText: `(${formatDuration(Date.now() - status.startedAt)})`,
        }
      : status._tag === 'completed'
        ? {
            color:
              status.finishedAt - status.startedAt > 1000
                ? '$redForeground'
                : '$greenForeground',
            text: 'Completed',
            durationText: `(${formatDuration(
              status.finishedAt - status.startedAt
            )})`,
          }
        : status._tag === 'failed'
          ? {
              color: '$redForeground',
              text: 'Failed',
              durationText: `(${formatDuration(
                status.finishedAt - status.startedAt
              )})`,
            }
          : {
              color: '$foregroundSecondary',
              text: 'Not Started',
              durationText: '',
            }

  return (
    <YStack
      key={id}
      paddingVertical="$2"
      paddingHorizontal="$3"
      bc="$backgroundSecondary"
      borderRadius="$2"
      borderWidth={1}
      borderColor="$backgroundTertiary"
      gap="$1"
    >
      <Typography variant="descriptionBold" color={statusState.color}>
        {statusState.text} {statusState.durationText}
      </Typography>
      <Typography variant="descriptionBold" color="$foregroundPrimary">
        {name}
      </Typography>
      <Typography variant="micro" color="$foregroundSecondary">
        Runs on: {requirements.runOn} | Requires login:{' '}
        {requirements.requiresUserLoggedIn ? 'Yes' : 'No'}
      </Typography>
      {status._tag === 'failed' && Boolean(status.error.message) && (
        <Typography variant="micro" color="$redForeground">
          Error: {status.error.message}
        </Typography>
      )}
      {dependencyIds.length > 0 && (
        <Typography variant="micro" color="$foregroundSecondary">
          Depends on: {dependencyIds}
        </Typography>
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
  const durationColor: TypographyColor = isInProgress
    ? '$accentHighlightSecondary'
    : duration > 1000
      ? '$redForeground'
      : '$greenForeground'

  return (
    <YStack
      onPress={() => {
        setIsExpanded(!isExpanded)
      }}
      paddingVertical="$2"
      paddingHorizontal="$3"
      bc="$backgroundSecondary"
      borderRadius="$2"
      borderWidth={1}
      borderColor="$backgroundTertiary"
      gap="$1"
    >
      <XStack justifyContent="space-between">
        <Typography variant="descriptionBold" color={durationColor}>
          {type}
        </Typography>
        <XStack gap="$2" alignItems="center">
          <Typography variant="description" color={durationColor}>
            {formatDuration(duration)}
          </Typography>
          <Typography variant="micro" color="$foregroundSecondary">
            {isExpanded ? '▼' : '▶'}
          </Typography>
        </XStack>
      </XStack>
      <Typography variant="micro" color="$foregroundSecondary">
        ID: {id}
      </Typography>
      {!!isExpanded && notificationData !== undefined && (
        <YStack
          paddingVertical="$2"
          paddingHorizontal="$2"
          borderRadius="$1"
          marginTop="$1"
        >
          <Typography variant="micro" color="$foregroundSecondary">
            {JSON.stringify(notificationData, null, 2)}
          </Typography>
        </YStack>
      )}
    </YStack>
  )
}

function renderTaskCards(
  tasks: readonly TaskEntry[]
): readonly React.ReactElement[] {
  return pipe(
    tasks,
    Array.map((task) => (
      <TaskCard key={task.id} id={task.id} task={task.task} />
    ))
  )
}

function TaskRegistrySection(): React.ReactElement {
  const registry = useAtomValue(taskRegistryAtom)

  const tasks: readonly TaskEntry[] = pipe(
    Array.fromIterable(registry),
    Array.map(([id, task]) => ({id, task}))
  )

  const pendingTasks = pipe(
    tasks,
    Array.filter((task) => task.task.status._tag === 'pending')
  )
  const completedTasks = pipe(
    tasks,
    Array.filter((task) => task.task.status._tag === 'completed')
  )
  const failedTasks = pipe(
    tasks,
    Array.filter((task) => task.task.status._tag === 'failed')
  )
  const notStartedTasks = pipe(
    tasks,
    Array.filter((task) => task.task.status._tag === 'notStartedYet')
  )

  return (
    <YStack gap="$2">
      <Typography variant="titlesSmall" color="$foregroundPrimary">
        Task Registry ({tasks.length} total)
      </Typography>

      {Array.isNonEmptyArray(pendingTasks) && (
        <YStack gap="$1">
          <Typography
            variant="descriptionBold"
            color="$accentHighlightSecondary"
          >
            Running ({pendingTasks.length})
          </Typography>
          {renderTaskCards(pendingTasks)}
        </YStack>
      )}

      {Array.isNonEmptyArray(failedTasks) && (
        <YStack gap="$1">
          <Typography variant="descriptionBold" color="$redForeground">
            Failed ({failedTasks.length})
          </Typography>
          {renderTaskCards(failedTasks)}
        </YStack>
      )}

      {Array.isNonEmptyArray(completedTasks) && (
        <YStack gap="$1">
          <Typography variant="descriptionBold" color="$greenForeground">
            Completed ({completedTasks.length})
          </Typography>
          {renderTaskCards(completedTasks)}
        </YStack>
      )}

      {Array.isNonEmptyArray(notStartedTasks) && (
        <YStack gap="$1">
          <Typography variant="descriptionBold" color="$foregroundSecondary">
            Not Started ({notStartedTasks.length})
          </Typography>
          {renderTaskCards(notStartedTasks)}
        </YStack>
      )}
    </YStack>
  )
}

function NotificationProcessingSection(): React.ReactElement {
  const notifications = useAtomValue(processingNotificationsAtom)

  const completed = pipe(
    notifications,
    Array.filter((notification) => Option.isSome(notification.end))
  )
  const inProgress = pipe(
    notifications,
    Array.filter((notification) => Option.isNone(notification.end))
  )

  return (
    <YStack gap="$2">
      <Typography variant="titlesSmall" color="$foregroundPrimary">
        Notification Processing ({notifications.length} total)
      </Typography>

      {Array.isNonEmptyArray(inProgress) && (
        <YStack gap="$1">
          <Typography
            variant="descriptionBold"
            color="$accentHighlightSecondary"
          >
            In Progress ({inProgress.length})
          </Typography>
          {pipe(
            inProgress,
            Array.map((notification) => (
              <NotificationCard
                key={notification.id}
                id={notification.id}
                type={notification.type}
                start={notification.start}
                end={notification.end}
                notificationData={notification.notificationData}
              />
            ))
          )}
        </YStack>
      )}

      {Array.isNonEmptyArray(completed) && (
        <YStack gap="$1">
          <Typography variant="descriptionBold" color="$greenForeground">
            Completed ({completed.length})
          </Typography>
          {pipe(
            completed,
            Array.map((notification) => (
              <NotificationCard
                key={notification.id}
                id={notification.id}
                type={notification.type}
                start={notification.start}
                end={notification.end}
                notificationData={notification.notificationData}
              />
            ))
          )}
        </YStack>
      )}

      {notifications.length === 0 && (
        <Typography variant="paragraphSmall" color="$foregroundSecondary">
          No notification processing reports
        </Typography>
      )}
    </YStack>
  )
}

export default function TaskRegistryOverviewScreen(): React.ReactElement {
  const safeGoBack = useSafeGoBack()
  const store = useStore()

  return (
    <Screen
      scrollable
      navigationBar={
        <NavigationBar
          style="back"
          title="Task Registry Overview"
          leftAction={{icon: ChevronLeft, onPress: safeGoBack}}
        />
      }
    >
      <YStack gap="$4">
        <Typography variant="heading3" color="$foregroundPrimary">
          Task Registry Overview
        </Typography>

        <TaskRegistrySection />

        <Stack h="$4" />

        <NotificationProcessingSection />

        <Stack h="$4" />

        <YStack gap="$2">
          <Button
            variant="primary"
            size="small"
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
          >
            Copy Task Registry JSON
          </Button>

          <Button
            variant="primary"
            size="small"
            onPress={() => {
              const notifications = store.get(processingNotificationsAtom)
              const formatted = pipe(
                notifications,
                Array.map((notification) => ({
                  id: notification.id,
                  type: notification.type,
                  start: notification.start,
                  end: Option.isSome(notification.end)
                    ? notification.end.value
                    : null,
                  duration: Option.isSome(notification.end)
                    ? notification.end.value - notification.start
                    : null,
                }))
              )
              Clipboard.setString(JSON.stringify(formatted, null, 2))
            }}
          >
            Copy Notification Reports JSON
          </Button>

          <Button variant="secondary" onPress={safeGoBack}>
            Back
          </Button>
        </YStack>
      </YStack>
    </Screen>
  )
}
