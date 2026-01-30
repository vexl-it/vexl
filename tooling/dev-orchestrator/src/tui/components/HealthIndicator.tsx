import {Box, Text} from 'ink'
import React from 'react'
import type {ServiceStatusValue} from '../types.js'

interface HealthIndicatorProps {
  status: ServiceStatusValue
  showLabel?: boolean
}

/**
 * Colored status indicator using Unicode symbols.
 * Per RESEARCH.md: Use @inkjs/ui Badge pattern but simpler for our needs.
 */
export const HealthIndicator: React.FC<HealthIndicatorProps> = ({
  status,
  showLabel = false,
}) => {
  const config: Record<
    ServiceStatusValue,
    {symbol: string; color: string; label: string}
  > = {
    pending: {symbol: '\u25CF', color: 'gray', label: 'pending'}, // Filled gray (not yet started)
    running: {symbol: '\u25CF', color: 'green', label: 'running'}, // Filled circle
    starting: {symbol: '\u25CF', color: 'yellow', label: 'starting'}, // Filled yellow (changed from empty)
    stopped: {symbol: '\u25CF', color: 'red', label: 'stopped'}, // Filled circle
    error: {symbol: '\u2717', color: 'red', label: 'error'}, // X mark
  }

  const {symbol, color, label} = config[status]

  return (
    <Box>
      <Text color={color}>{symbol}</Text>
      {!!showLabel && <Text color={color}> {label}</Text>}
    </Box>
  )
}

/**
 * Infrastructure indicator (Postgres/Redis)
 */
interface InfraIndicatorProps {
  name: string
  status: 'running' | 'stopped'
}

export const InfraIndicator: React.FC<InfraIndicatorProps> = ({
  name,
  status,
}) => {
  const color = status === 'running' ? 'green' : 'red'
  const symbol = status === 'running' ? '\u25CF' : '\u25CB'

  return (
    <Box gap={1}>
      <Text color={color}>{symbol}</Text>
      <Text>{name}</Text>
    </Box>
  )
}
