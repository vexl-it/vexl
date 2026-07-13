import {CaptureProtection} from 'react-native-capture-protection'

/**
 * Central owner of the global screenshot/recording protection state.
 *
 * `react-native-capture-protection` is last-writer-wins: whoever calls
 * `prevent()`/`allow()` last wins globally. That is unacceptable for device
 * migration, where QR/authentication-code screens MUST stay capture-protected
 * regardless of the user's ordinary screenshot preference (spec section
 * "Privacy and security requirements"). All writers therefore go through this
 * module and conflicts always resolve in favor of protection:
 *
 *   protection is ON  ⇔  (active leases > 0) OR baseline wants protection
 *
 * - Leases ({@link acquireCaptureProtectionLease}) are used by migration UI.
 *   The module is deliberately dependency-free (no React, no Jotai) so a
 *   lease can be held from the migration-only boot root before any app state
 *   exists.
 * - The baseline ({@link setBaselineCaptureProtection}) is driven by the
 *   ordinary `screenshotsDisabledAtom` logic in
 *   components/PreventScreenshots.tsx.
 */

let activeLeaseCount = 0
let baselineWantsProtection = false
let lastAppliedProtection: boolean | undefined

function applyProtection(): void {
  const shouldProtect = activeLeaseCount > 0 || baselineWantsProtection
  if (shouldProtect === lastAppliedProtection) return
  lastAppliedProtection = shouldProtect
  if (shouldProtect) void CaptureProtection.prevent()
  else void CaptureProtection.allow()
}

/**
 * Acquires one capture-protection lease and returns its release function.
 * Protection is forced on while at least one lease is active. The returned
 * release is idempotent — calling it more than once releases the lease only
 * once.
 */
export function acquireCaptureProtectionLease(): () => void {
  activeLeaseCount += 1
  applyProtection()

  let released = false
  return () => {
    if (released) return
    released = true
    activeLeaseCount -= 1
    applyProtection()
  }
}

/**
 * Sets the ordinary (preference-driven) protection baseline. Turning the
 * baseline off never lifts protection while migration leases are active.
 */
export function setBaselineCaptureProtection(enabled: boolean): void {
  baselineWantsProtection = enabled
  applyProtection()
}

/** Number of currently active leases. Exposed for tests. */
export function getActiveCaptureProtectionLeaseCount(): number {
  return activeLeaseCount
}
