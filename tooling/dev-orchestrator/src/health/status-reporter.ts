import pc from 'picocolors'
import type {HealthReport, ServiceHealthStatus} from './status-checker.js'

// Format a service status line
const formatServiceLine = (service: ServiceHealthStatus): string => {
  const icon =
    service.status === 'running' ? pc.green('\u2713') : pc.red('\u2717')
  const status =
    service.status === 'running' ? pc.green('running') : pc.red('stopped')
  const ports = pc.dim(
    `(health: ${String(service.healthPort)}, main: ${String(service.mainPort)})`
  )
  return `  ${icon} ${service.displayName.padEnd(20)} ${status.padEnd(15)} ${ports}`
}

// Print health report to console with colors
export const printHealthReport = (report: HealthReport): void => {
  console.log('')
  console.log(pc.bold('Vexl Dev Environment Health Check'))
  console.log(pc.dim(`Checked at: ${report.timestamp.toISOString()}`))
  console.log('')

  // Infrastructure
  console.log(pc.bold('Infrastructure:'))
  const pgIcon =
    report.infrastructure.postgres === 'running'
      ? pc.green('\u2713')
      : pc.red('\u2717')
  const pgStatus =
    report.infrastructure.postgres === 'running'
      ? pc.green('running')
      : pc.red('stopped')
  console.log(
    `  ${pgIcon} ${'Postgres'.padEnd(20)} ${pgStatus.padEnd(15)} ${pc.dim(`(port: ${String(report.infrastructure.postgresPort)})`)}`
  )

  const redisIcon =
    report.infrastructure.redis === 'running'
      ? pc.green('\u2713')
      : pc.red('\u2717')
  const redisStatus =
    report.infrastructure.redis === 'running'
      ? pc.green('running')
      : pc.red('stopped')
  console.log(
    `  ${redisIcon} ${'Redis'.padEnd(20)} ${redisStatus.padEnd(15)} ${pc.dim(`(port: ${String(report.infrastructure.redisPort)})`)}`
  )
  console.log('')

  // Services
  console.log(pc.bold('Services:'))
  for (const service of report.services) {
    console.log(formatServiceLine(service))
  }
  console.log('')

  // Summary
  console.log(pc.bold('Summary:'))
  console.log(`  Total: ${String(report.summary.total)}`)
  console.log(`  ${pc.green('Running:')} ${String(report.summary.running)}`)
  console.log(`  ${pc.red('Stopped:')} ${String(report.summary.stopped)}`)
  console.log('')

  // Overall status
  if (
    report.summary.stopped === 0 &&
    report.infrastructure.postgres === 'running' &&
    report.infrastructure.redis === 'running'
  ) {
    console.log(pc.green(pc.bold('\u2713 All systems operational')))
  } else {
    console.log(pc.yellow(pc.bold('! Some services are not running')))
  }
  console.log('')
}

// Format health report as JSON for --json flag
export const formatHealthReportJson = (report: HealthReport): string =>
  JSON.stringify(report, null, 2)
