/**
 * Per-process logging: tee a child's stdout/stderr to the console (prefixed with
 * the service name) AND append JSONL lines to `local/services-logs/<name>.log`
 * in the shape Alloy tails: {timestamp, service, stream, message}.
 */
import {createWriteStream, mkdirSync, type WriteStream} from 'node:fs'
import {join} from 'node:path'
import {type LokiPusher} from './loki'
import {repoRoot} from './secrets'

export const logsDir = join(repoRoot, 'local', 'services-logs')

export function ensureLogsDir(): void {
  mkdirSync(logsDir, {recursive: true})
}

export type LogStream = 'stdout' | 'stderr'

const COLORS = [
  '\x1b[36m', // cyan
  '\x1b[32m', // green
  '\x1b[33m', // yellow
  '\x1b[35m', // magenta
  '\x1b[34m', // blue
  '\x1b[91m', // bright red
  '\x1b[92m', // bright green
  '\x1b[94m', // bright blue
  '\x1b[95m', // bright magenta
  '\x1b[96m', // bright cyan
]
const RESET = '\x1b[0m'

export interface ServiceLogger {
  /** Feed a raw chunk from a child stream; splits into lines and logs each. */
  readonly feed: (stream: LogStream, chunk: string) => void
  /** Log a supervisor-level line for this service. */
  readonly note: (message: string) => void
  /** Flush any buffered partial lines and close the file. */
  readonly close: () => Promise<void>
}

/** Best-effort log level for the Loki `level` label, parsed from JSON logs. */
function levelOf(message: string): string {
  const trimmed = message.trimStart()
  if (!trimmed.startsWith('{')) return 'meta'
  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'logLevel' in parsed &&
      typeof parsed.logLevel === 'string'
    ) {
      return parsed.logLevel.toLowerCase()
    }
  } catch {
    // Not JSON; fall through.
  }
  return 'unknown'
}

export function createServiceLogger(
  name: string,
  colorIndex: number,
  pusher?: LokiPusher
): ServiceLogger {
  const file: WriteStream = createWriteStream(join(logsDir, `${name}.log`), {
    flags: 'a',
  })
  const color = COLORS[colorIndex % COLORS.length]
  const prefix = `${color}[${name}]${RESET}`

  const buffers: Record<LogStream, string> = {stdout: '', stderr: ''}

  const emit = (stream: LogStream, message: string): void => {
    const timestamp = new Date().toISOString()
    file.write(
      `${JSON.stringify({timestamp, service: name, stream, message})}\n`
    )
    const out = stream === 'stderr' ? process.stderr : process.stdout
    out.write(`${prefix} ${message}\n`)
    // Ship straight to Loki from the host (see loki.ts for why not file-tailing).
    pusher?.enqueue(
      {
        job: 'vexl-backend',
        environment: 'local',
        service: name,
        stream,
        level: levelOf(message),
      },
      message
    )
  }

  const feed = (stream: LogStream, chunk: string): void => {
    const combined = buffers[stream] + chunk
    const lines = combined.split('\n')
    buffers[stream] = lines.pop() ?? ''
    for (const line of lines) emit(stream, line)
  }

  const close = async (): Promise<void> => {
    const streams: readonly LogStream[] = ['stdout', 'stderr']
    for (const stream of streams) {
      const remainder = buffers[stream]
      if (remainder.length > 0) {
        emit(stream, remainder)
        buffers[stream] = ''
      }
    }
    await new Promise<void>((resolve, reject) => {
      file.once('finish', resolve)
      file.once('error', reject)
      file.end()
    })
  }

  return {
    feed,
    note: (message) => {
      emit('stdout', message)
    },
    close,
  }
}
