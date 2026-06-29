/**
 * Minimal Loki push client for the dev supervisor.
 *
 * Backend services run on the HOST, so we push their captured log lines straight
 * to Loki's HTTP push API rather than writing files for an in-container Alloy to
 * tail. On macOS Docker, a file held open and appended-to by a host process is
 * NOT synced into a bind-mounted container (the container only ever sees the
 * first line), which silently dropped everything after the startup line. Pushing
 * from the host avoids that entirely and works the same on every platform.
 */
import {Array, pipe} from 'effect'

interface PendingEntry {
  readonly streamKey: string
  readonly labels: Record<string, string>
  readonly tsNs: string
  readonly line: string
}

export interface LokiPusher {
  readonly enqueue: (labels: Record<string, string>, line: string) => void
  readonly flush: () => Promise<void>
  readonly close: () => Promise<void>
}

export function createLokiPusher(pushUrl: string): LokiPusher {
  let buffer: PendingEntry[] = []
  // Per-stream last timestamp, so entries within a stream are strictly
  // increasing (Date.now() is ms-precision; many lines share a millisecond).
  const lastNsByStream = new Map<string, bigint>()
  let warned = false
  let activeFlush: Promise<void> = Promise.resolve()

  const nextNs = (streamKey: string): string => {
    let ns = BigInt(Date.now()) * 1_000_000n
    const last = lastNsByStream.get(streamKey)
    if (last !== undefined && ns <= last) ns = last + 1n
    lastNsByStream.set(streamKey, ns)
    return ns.toString()
  }

  const enqueue = (labels: Record<string, string>, line: string): void => {
    const streamKey = JSON.stringify(labels)
    buffer.push({streamKey, labels, tsNs: nextNs(streamKey), line})
  }

  const warnOnce = (message: string): void => {
    if (warned) return
    warned = true
    console.warn(`[loki] ${message} — logs may be missing in Grafana.`)
  }

  const flushOnce = async (): Promise<void> => {
    if (!Array.isNonEmptyArray(buffer)) return
    const batch = buffer
    buffer = []

    const byStream = new Map<
      string,
      {labels: Record<string, string>; values: Array<[string, string]>}
    >()
    for (const entry of batch) {
      const existing = byStream.get(entry.streamKey)
      if (existing !== undefined) {
        existing.values.push([entry.tsNs, entry.line])
      } else {
        byStream.set(entry.streamKey, {
          labels: entry.labels,
          values: [[entry.tsNs, entry.line]],
        })
      }
    }
    const streams = pipe(
      globalThis.Array.from(byStream.values()),
      Array.map((stream) => ({
        stream: stream.labels,
        values: stream.values,
      }))
    )

    try {
      const response = await fetch(pushUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({streams}),
      })
      if (!response.ok) {
        warnOnce(`push returned ${response.status}`)
      }
    } catch (error) {
      warnOnce(
        `push error: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const flush = async (): Promise<void> => {
    activeFlush = activeFlush.then(flushOnce, flushOnce)
    await activeFlush
  }

  const timer = setInterval(() => {
    void flush()
  }, 1000)
  // Don't keep the process alive just for the flush timer.
  timer.unref()

  return {
    enqueue,
    flush,
    close: async () => {
      clearInterval(timer)
      await flush()
      await activeFlush
    },
  }
}
