#!/usr/bin/env node
import {Command} from 'commander'
import {Effect} from 'effect'
import {
  checkAllServicesHealth,
  formatHealthReportJson,
  printHealthReport,
} from './health/index.js'

const program = new Command()

program
  .name('dev-health')
  .description('Check health status of Vexl dev services')
  .version('1.0.0')
  .option('-j, --json', 'Output as JSON')
  .option(
    '-s, --service <name>',
    'Check specific service only (not implemented yet)'
  )
  .action(async (options: {json?: boolean; service?: string}) => {
    const report = await Effect.runPromise(checkAllServicesHealth())

    if (options.json === true) {
      console.log(formatHealthReportJson(report))
    } else {
      printHealthReport(report)
    }

    // Exit with non-zero if any services are stopped
    const allRunning =
      report.summary.stopped === 0 &&
      report.infrastructure.postgres === 'running' &&
      report.infrastructure.redis === 'running'

    process.exit(allRunning ? 0 : 1)
  })

program.parse()
