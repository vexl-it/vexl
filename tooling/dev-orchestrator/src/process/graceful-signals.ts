/**
 * Keep the orchestrator alive across *repeated* termination signals so its
 * graceful shutdown (run as Effect finalizers via NodeRuntime.runMain) can
 * finish.
 *
 * Why this is needed:
 * When the user presses Ctrl+C, the terminal delivers SIGINT to the whole
 * foreground process group, so this process receives it directly. On top of
 * that, the parent `pnpm` process (the recursive `pnpm --filter <pkg> <script>`
 * run) forwards the signal to its child a moment later. The orchestrator
 * therefore receives SIGINT twice, ~1ms apart.
 *
 * NodeRuntime.runMain registers its own SIGINT/SIGTERM handler that removes
 * itself after the first signal (it then interrupts the main fiber to run the
 * shutdown finalizers). Without an additional, persistent listener the *second*
 * signal would hit Node's default action and hard-kill the process mid-shutdown
 * — orphaning every spawned service and exiting via the signal (which pnpm
 * reports as a failed command).
 *
 * Registering a persistent listener suppresses Node's default action for the
 * duplicate signal, letting the first-signal shutdown run to completion and the
 * process exit cleanly (code 0). A clearly separate, later signal is still
 * honored as a force-quit so a stuck shutdown can be aborted.
 */
export const installGracefulSignalHandling = (): void => {
  // Window covering the near-instant duplicate forwarded by the parent pnpm
  // process. Anything beyond it is treated as a deliberate second request.
  const DUPLICATE_SIGNAL_WINDOW_MS = 1000

  let firstSignalAt: number | undefined

  const onSignal = (): void => {
    const now = Date.now()

    if (firstSignalAt === undefined) {
      // First request: let NodeRuntime's handler drive the graceful shutdown.
      firstSignalAt = now
      return
    }

    if (now - firstSignalAt > DUPLICATE_SIGNAL_WINDOW_MS) {
      // Deliberate second request well after the first — force quit.
      process.exit(130)
    }

    // Otherwise: the near-instant duplicate from the parent pnpm — ignore it.
  }

  process.on('SIGINT', onSignal)
  process.on('SIGTERM', onSignal)
}
