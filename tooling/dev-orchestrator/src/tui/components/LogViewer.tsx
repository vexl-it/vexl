import {Box, Text} from 'ink'
import React from 'react'
import type {LogLine} from '../types.js'

interface LogViewerProps {
  logs: readonly LogLine[]
  maxHeight?: number
  scrollOffset: number // lines scrolled from bottom
  isFocused: boolean // whether this panel has scroll focus
  totalLogs: number // total filtered log count for indicator
}

/**
 * Log viewer component showing recent log lines.
 * Per RESEARCH.md: Uses simple rendering for visible logs.
 * Parent (useLogBuffer) handles scrollOffset slicing, this component receives pre-sliced logs.
 */
export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  maxHeight = 15,
  scrollOffset,
  isFocused,
  totalLogs,
}) => {
  // Take only the logs that fit in maxHeight
  // Note: logs are already sliced by parent based on scrollOffset
  const visibleLogs = logs.slice(-maxHeight)

  // Suppress unused variable warning - isFocused is used by parent for border color
  void isFocused

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Log lines */}
      <Box flexDirection="column">
        {visibleLogs.length === 0 ? (
          <Text dimColor>No logs yet...</Text>
        ) : (
          visibleLogs.map((log) => <LogLineRow key={log.id} log={log} />)
        )}
      </Box>

      {/* Show count of hidden logs and scroll position */}
      {totalLogs > maxHeight && (
        <Text dimColor>
          Showing {Math.min(visibleLogs.length, maxHeight)} of {totalLogs} lines
          {scrollOffset > 0 && ` (scrolled up ${scrollOffset})`}
        </Text>
      )}

      {/* Show scroll indicator when scrolled up */}
      {scrollOffset > 0 && totalLogs <= maxHeight && (
        <Text dimColor>Scrolled up {scrollOffset} lines</Text>
      )}
    </Box>
  )
}

interface LogLineRowProps {
  log: LogLine
}

const LogLineRow: React.FC<LogLineRowProps> = ({log}) => {
  // Get service color from palette
  const serviceColor = getServiceColorForTui(log.service)

  return (
    <Box>
      {/* Service badge */}
      <Box width={22}>
        <Text color={serviceColor} bold>
          [{log.service}]
        </Text>
      </Box>

      {/* Message */}
      <Text color={log.isError ? 'red' : undefined} wrap="truncate">
        {log.message}
      </Text>
    </Box>
  )
}

/**
 * Map service name to Ink color.
 * Matches existing color palette from colors.ts
 */
function getServiceColorForTui(serviceName: string): string {
  const colorMap: Record<string, string> = {
    'user-service': 'cyan',
    'contact-service': 'magenta',
    'offer-service': 'yellow',
    'chat-service': 'green',
    'location-service': 'blue',
    'notification-service': 'red',
    'btc-exchange-rate-service': 'yellowBright',
    'feedback-service': 'cyanBright',
    'content-service': 'magentaBright',
    'metrics-service': 'greenBright',
    orchestrator: 'white',
    docker: 'gray',
  }

  return colorMap[serviceName] ?? 'white'
}
