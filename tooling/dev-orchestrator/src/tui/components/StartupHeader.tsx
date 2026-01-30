import {Text} from 'ink'
import React from 'react'

/**
 * Props for StartupHeader component.
 */
export interface StartupHeaderProps {
  readonly readyCount: number
  readonly totalCount: number
  readonly isComplete: boolean
  readonly showNotification: boolean // Brief "All services ready" notification
}

/**
 * Header showing startup progress.
 * Displays "X/Y services ready" during startup, "All services running" after,
 * and briefly shows "All services ready" notification when startup completes.
 */
export const StartupHeader: React.FC<StartupHeaderProps> = ({
  readyCount,
  totalCount,
  isComplete,
  showNotification,
}) => {
  // Show notification briefly when all services just became ready
  if (showNotification) {
    return <Text color="green">{'\u2713'} All services ready</Text>
  }

  // After notification fades, show steady-state message
  if (isComplete) {
    return <Text>All services running</Text>
  }

  // During startup, show progress counter
  return (
    <Text>
      {readyCount}/{totalCount} services ready
    </Text>
  )
}
