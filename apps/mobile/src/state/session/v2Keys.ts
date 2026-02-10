import {type KeyPairV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import * as cryptobox from '@vexl-next/cryptography/src/operations/cryptobox'
import {Effect, Option} from 'effect'
import {getDefaultStore} from 'jotai'
import {sessionDataOrDummyAtom} from '.'
import {type Session} from '../../brands/Session.brand'

/**
 * Error thrown when V2 key generation fails
 */
export class V2KeyGenerationError extends Error {
  readonly _tag = 'V2KeyGenerationError'
  constructor(message: string, cause?: unknown) {
    super(message, {cause})
    this.name = 'V2KeyGenerationError'
  }
}

/**
 * Error thrown when V2 key sync to backend fails
 */
export class V2KeySyncError extends Error {
  readonly _tag = 'V2KeySyncError'
  constructor(message: string, cause?: unknown) {
    super(message, {cause})
    this.name = 'V2KeySyncError'
  }
}

/**
 * Generates a new V2 keypair using libsodium X25519.
 */
export function generateV2KeyPair(): Effect.Effect<
  KeyPairV2,
  V2KeyGenerationError
> {
  return Effect.tryPromise({
    try: () => cryptobox.generateKeyPair(),
    catch: (e) => new V2KeyGenerationError('Failed to generate V2 keypair', e),
  })
}

/**
 * Gets the V2 session keypair from the current session.
 * Returns Option.none() if session doesn't have V2 keys yet.
 */
export function getV2SessionKeyPair(): Option.Option<KeyPairV2> {
  const session = getDefaultStore().get(sessionDataOrDummyAtom)
  return Option.fromNullable(session.keyPairV2)
}

/**
 * React hook to get V2 session keypair.
 * Note: This function reads from the session atom, so it will re-render
 * when the session changes.
 */
export function useV2SessionKeyPair(): Option.Option<KeyPairV2> {
  // This is called from useV2SessionKeyPairAssumeExists in index.ts
  // which uses useAtomValue(sessionAtom) for reactivity
  return getV2SessionKeyPair()
}

/**
 * Ensures V2 session keys exist, generating them if needed.
 * This should be called during session load after the session is established.
 *
 * @param session - The current session (may or may not have V2 keys)
 * @returns The session with V2 keys guaranteed to exist
 */
export function ensureV2SessionKeysExist(
  session: Session
): Effect.Effect<Session, V2KeyGenerationError> {
  return Effect.gen(function* () {
    // If keys already exist, return session as-is
    if (session.keyPairV2) {
      yield* Effect.log('V2 session keys already exist')
      return session
    }

    // Generate new keypair
    yield* Effect.log('Generating new V2 session keypair')
    const keypair = yield* generateV2KeyPair()

    // Return session with V2 keys added
    const updatedSession: Session = {
      ...session,
      keyPairV2: keypair,
    }

    yield* Effect.log('V2 session keys generated')

    return updatedSession
  })
}
