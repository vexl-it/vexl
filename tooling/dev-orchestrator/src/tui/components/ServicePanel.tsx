import {Box, Text} from 'ink'
import React from 'react'
import type {InfraStatus, ServiceStatus} from '../types.js'
import {HealthIndicator, InfraIndicator} from './HealthIndicator.js'

interface ServicePanelProps {
  services: readonly ServiceStatus[]
  infrastructure: InfraStatus
  selectedIndex: number
  elapsedTimes?: Map<string, number> // Optional elapsed times per service (only for 'starting')
  onSelectService?: (index: number) => void
}

/**
 * Panel showing all services with their health status.
 * Selected service is highlighted for keyboard navigation.
 */
export const ServicePanel: React.FC<ServicePanelProps> = ({
  services,
  infrastructure,
  selectedIndex,
  elapsedTimes,
}) => {
  return (
    <Box flexDirection="column">
      {/* Infrastructure status */}
      <Box marginBottom={1}>
        <Text bold>Infrastructure: </Text>
        <Box gap={2}>
          <InfraIndicator name="Postgres" status={infrastructure.postgres} />
          <InfraIndicator name="Redis" status={infrastructure.redis} />
        </Box>
      </Box>

      {/* Services list */}
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold underline>
            Services ({services.length})
          </Text>
        </Box>
        {services.map((service, index) => (
          <ServiceRow
            key={service.name}
            service={service}
            isSelected={index === selectedIndex}
            elapsedSeconds={elapsedTimes?.get(service.name)}
          />
        ))}
      </Box>
    </Box>
  )
}

interface ServiceRowProps {
  service: ServiceStatus
  isSelected: boolean
  elapsedSeconds?: number // Only passed when status is 'starting'
}

const ServiceRow: React.FC<ServiceRowProps> = ({
  service,
  isSelected,
  elapsedSeconds,
}) => {
  // Show elapsed time only while service is starting
  const showElapsed =
    service.status === 'starting' && elapsedSeconds !== undefined

  return (
    <Box>
      {/* Selection indicator */}
      <Text color={isSelected ? 'cyan' : undefined}>
        {isSelected ? '\u25B6 ' : '  '}
      </Text>

      {/* Health status */}
      <Box width={3}>
        <HealthIndicator status={service.status} />
      </Box>

      {/* Service name */}
      <Box width={25}>
        <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
          {service.displayName}
        </Text>
      </Box>

      {/* Show elapsed time during starting, port when ready */}
      {showElapsed ? (
        <Text dimColor>{elapsedSeconds}s</Text>
      ) : (
        <Text dimColor>:{service.port}</Text>
      )}
    </Box>
  )
}
