'use client'

import {ecdsa} from '@vexl-next/cryptography'
import {PrivateKeyHolder} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {Buffer} from 'buffer'
import {Schema} from 'effect'

export const STORAGE_KEYPAIR_KEY = 'keypair'

class ErrorGettingKeypair extends Schema.TaggedError<ErrorGettingKeypair>(
  'ErrorGettingKeypair'
)('ErrorGettingKeypair', {
  cause: Schema.Unknown,
}) {}

class NoKeypairStored extends Schema.TaggedError<NoKeypairStored>(
  'NoKeypairStored'
)('NoKeypairStored', {}) {}

class JsonParseError extends Schema.TaggedError<JsonParseError>(
  'JsonParseError'
)('JsonParseError', {
  cause: Schema.Unknown,
}) {}

class InvalidKeypairStored extends Schema.TaggedError<InvalidKeypairStored>(
  'InvalidKeypairStored'
)('InvalidKeypairStored', {
  cause: Schema.Unknown,
}) {}

class ErrorSigning extends Schema.TaggedError<ErrorSigning>('ErrorSigning')(
  'ErrorSigning',
  {
    cause: Schema.Unknown,
  }
) {}

export function ensureBrowserPolyfills(): void {
  window.Buffer ??= Buffer
}

function parseJson(json: string): unknown {
  try {
    return JSON.parse(json)
  } catch (cause) {
    throw new JsonParseError({cause})
  }
}

function getKeypair(): PrivateKeyHolder {
  let storedKeypair: string | null

  try {
    storedKeypair = sessionStorage.getItem(STORAGE_KEYPAIR_KEY)
  } catch (cause) {
    throw new ErrorGettingKeypair({cause})
  }

  if (storedKeypair === null) {
    throw new NoKeypairStored()
  }

  const parsedKeypair = parseJson(storedKeypair)

  try {
    return Schema.decodeUnknownSync(PrivateKeyHolder)(parsedKeypair)
  } catch (cause) {
    throw new InvalidKeypairStored({cause})
  }
}

function signChallenge(challenge: string, keypair: PrivateKeyHolder): string {
  try {
    return ecdsa.ecdsaSign({
      challenge,
      privateKey: keypair.privateKeyPemBase64,
    })
  } catch (cause) {
    throw new ErrorSigning({cause})
  }
}

export function createSignedChallenge(challenge: string):
  | {
      ok: true
      keypair: PrivateKeyHolder
      signature: string
    }
  | {
      ok: false
      error:
        | ErrorGettingKeypair
        | JsonParseError
        | NoKeypairStored
        | InvalidKeypairStored
        | ErrorSigning
    } {
  try {
    const keypair = getKeypair()
    const signature = signChallenge(challenge, keypair)

    return {
      keypair,
      ok: true,
      signature,
    }
  } catch (error) {
    return {
      error:
        error instanceof ErrorGettingKeypair ||
        error instanceof JsonParseError ||
        error instanceof NoKeypairStored ||
        error instanceof InvalidKeypairStored ||
        error instanceof ErrorSigning
          ? error
          : new ErrorSigning({cause: error}),
      ok: false,
    }
  }
}
