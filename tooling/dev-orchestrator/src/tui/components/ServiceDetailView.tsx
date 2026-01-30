import {Box, Text} from 'ink'
import React from 'react'
import {
  calculateAvailableLogLines,
  useTerminalDimensions,
} from '../hooks/useTerminalDimensions.js'
import type {LogLine, ServiceStatus} from '../types.js'
import {HealthIndicator} from './HealthIndicator.js'
import {LogViewer} from './LogViewer.js'

/**
 * Log buffer interface matching useLogBuffer return type.
 * Only includes the properties needed for ServiceDetailView.
 */
interface LogBuffer {
  readonly visibleLogs: readonly LogLine[]
  readonly filteredLogs: readonly LogLine[]
  readonly scrollOffset: number
}

interface ServiceDetailViewProps {
  service: ServiceStatus
  logBuffer: LogBuffer
  onExit: () => void
}

/**
 * Fullscreen service log detail view.
 * Shows logs for a single service with header showing service name and status.
 * Keyboard handling is centralized in App.tsx - this component only renders.
 */
export const ServiceDetailView: React.FC<ServiceDetailViewProps> = ({
  service,
  logBuffer,
  onExit,
}) => {
  // Suppress unused variable warning - onExit is used by parent for keyboard handling
  void onExit

  // Get terminal dimensions for dynamic log height
  // Detail view has less overhead (no service panel) so add a few more lines
  const terminalDimensions = useTerminalDimensions()
  const availableLogLines =
    calculateAvailableLogLines(terminalDimensions.rows) + 3

  return (
    <Box flexDirection="column" padding={1} height="100%">
      {/* Header with service name and status */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {service.displayName}
        </Text>
        <Text> - </Text>
        <HealthIndicator status={service.status} showLabel />
        <Text dimColor> (press Escape to return)</Text>
      </Box>

      {/* Full-height log viewer */}
      <Box borderStyle="single" flexGrow={1} flexDirection="column" padding={1}>
        <LogViewer
          logs={logBuffer.visibleLogs}
          maxHeight={availableLogLines}
          scrollOffset={logBuffer.scrollOffset}
          isFocused={true}
          totalLogs={logBuffer.filteredLogs.length}
        />
      </Box>

      {/* Help bar */}
      <Box marginTop={1}>
        <Text dimColor>
          <Text bold>Escape</Text> return |<Text bold> {'\u2191\u2193'}</Text>{' '}
          scroll |<Text bold> PgUp/PgDn</Text> fast scroll |<Text bold> r</Text>{' '}
          restart |<Text bold> Ctrl+L</Text> clear logs
        </Text>
      </Box>
    </Box>
  )
}
