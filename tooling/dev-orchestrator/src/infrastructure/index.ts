/**
 * Infrastructure module - handles Docker and health checks
 *
 * Responsibilities:
 * - Start/stop Docker Compose services
 * - Poll health check status
 * - Report infrastructure readiness
 */

export * from './docker.js'
