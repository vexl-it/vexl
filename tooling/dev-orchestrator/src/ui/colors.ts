import pc from 'picocolors'

/**
 * Color functions for each service.
 * Per RESEARCH.md: distinct colors, avoiding red (reserved for errors).
 */
export const SERVICE_COLORS: Record<string, (s: string) => string> = {
  docker: pc.gray,
  'user-service': pc.cyan,
  'contact-service': pc.green,
  'offer-service': pc.yellow,
  'chat-service': pc.magenta,
  'location-service': pc.blue,
  'notification-service': pc.white,
  'btc-exchange-rate-service': pc.cyan,
  'feedback-service': pc.green,
  'content-service': pc.yellow,
  'metrics-service': pc.magenta,
}

/**
 * Get color function for a service, with fallback to white.
 */
export const getServiceColor = (name: string): ((s: string) => string) =>
  SERVICE_COLORS[name] ?? pc.white

/**
 * Format a service badge with color.
 */
export const formatBadge = (name: string): string => {
  const color = getServiceColor(name)
  return color(`[${name}]`)
}
