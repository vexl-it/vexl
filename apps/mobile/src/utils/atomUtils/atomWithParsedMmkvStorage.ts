import {Array, Either, Schema, pipe, type ParseResult} from 'effect'
import {atom, type PrimitiveAtom, type SetStateAction} from 'jotai'
import {InteractionManager} from 'react-native'
import {storage} from '../mmkv/effectMmkv'
import reportError from '../reportError'
import getValueFromSetStateActionOfAtom from './getValueFromSetStateActionOfAtom'

export const CLEAR_STORAGE_KEY = '__clear_storage'

// TODO: Temporary diagnostic to track atom initialization results on startup.
// Remove once the root cause of user data loss is identified.
type InitResult = 'loaded' | 'valueNotSet' | 'parseError'
const atomInitResults = new Map<string, InitResult>()
let startupReportScheduled = false

function scheduleStartupReport(): void {
  if (startupReportScheduled) return
  startupReportScheduled = true

  setTimeout(() => {
    try {
      const entries = Array.fromIterable(atomInitResults.entries())
      const keysWithResult = (result: InitResult): string[] =>
        pipe(
          entries,
          Array.filter(([, v]) => v === result),
          Array.map(([k]) => k)
        )
      const valueNotSetKeys = keysWithResult('valueNotSet')
      const parseErrorKeys = keysWithResult('parseError')
      const loadedKeys = keysWithResult('loaded')

      // Only report parse errors. Keys that were simply never written
      // (`valueNotSet`) are expected on every startup, so reporting them
      // unconditionally would fire the summary on every single app start.
      if (Array.isNonEmptyArray(parseErrorKeys)) {
        reportError('warn', new Error('MMKV atom initialization summary'), {
          loaded: loadedKeys,
          valueNotSet: valueNotSetKeys,
          parseError: parseErrorKeys,
          totalKeys: storage._storage.getAllKeys().length,
        })
      }
    } catch {}
  }, 5000)
}

interface StoredRead<A> {
  value: A
  /**
   * The raw string the value was decoded from. `undefined` when the key was
   * not set or could not be read at all. Used to cheaply detect whether the
   * stored value changed between atom creation and mount without re-decoding.
   */
  raw: string | undefined
}

function isValidJson(raw: string): boolean {
  try {
    JSON.parse(raw)
    return true
  } catch {
    return false
  }
}

function readRawString(key: string): string | undefined {
  try {
    return storage._storage.getString(key) ?? undefined
  } catch {
    return undefined
  }
}

function getInitialValue<A>({
  key,
  decodeRawValue,
  defaultValue,
}: {
  key: string
  decodeRawValue: (raw: string) => Either.Either<A, ParseResult.ParseError>
  defaultValue: A
}): StoredRead<A> {
  scheduleStartupReport()

  return pipe(
    storage.get(key),
    Either.match({
      onLeft: (l): StoredRead<A> => {
        if (l._tag === 'ValueNotSet') {
          atomInitResults.set(key, 'valueNotSet')
        } else {
          atomInitResults.set(key, 'parseError')
          reportError(
            'warn',
            new Error(
              `Error while parsing stored value. Using provided default. Key: ${key}`
            ),
            {errorTag: l._tag}
          )
        }
        return {value: defaultValue, raw: undefined}
      },
      onRight: (raw): StoredRead<A> =>
        pipe(
          decodeRawValue(raw),
          Either.match({
            onLeft: (e): StoredRead<A> => {
              atomInitResults.set(key, 'parseError')
              reportError(
                'warn',
                new Error(
                  `Error while parsing stored value. Using provided default. Key: ${key}`
                ),
                {
                  errorTag: e._tag,
                  rawValueLength: raw.length,
                  rawValueIsValidJson: isValidJson(raw),
                }
              )
              return {value: defaultValue, raw}
            },
            onRight: (value): StoredRead<A> => {
              atomInitResults.set(key, 'loaded')
              return {value, raw}
            },
          })
        ),
    })
  )
}

/**
 * Creates a primitive atom persisted in MMKV under the given key.
 *
 * - The stored value is validated with the given schema on every read.
 * - Writes are deferred behind `InteractionManager.runAfterInteractions` and
 *   coalesced: when several writes happen before the deferred flush runs, only
 *   the newest value is encoded and persisted (last-write-wins; intermediate
 *   values are never written to storage).
 * - Writes to the same key made by anyone else (another atom for the same key,
 *   direct storage writes) are picked up via the MMKV change listener while
 *   the atom is mounted.
 *
 * Note on backward compatibility: older app versions embedded an
 * `___author_id` field into the persisted blob to tell own writes apart from
 * foreign ones. Own writes are now detected with an in-memory flag (see
 * `isPersistingOwnValue` below), so the field is no longer written. Blobs that
 * still contain it decode fine — effect Schema structs ignore excess
 * properties by default.
 */
export function atomWithParsedMmkvStorage<A, I extends object>(
  key: string,
  defaultValue: A,
  schema: Schema.Schema<A, I, never>,
  debugLabel?: string
): PrimitiveAtom<A> {
  const decodeRawValue = Schema.decodeEither(Schema.parseJson(schema))
  const persistValue = storage.saveVerified(key, schema)

  // True only for the synchronous duration of this atom's own storage.set
  // call. react-native-mmkv dispatches change listeners synchronously from
  // `set()` (see MMKV.set -> onValuesChanged in the library's JS wrapper), so
  // the mount listener below can use this flag to tell this atom's own writes
  // apart from foreign ones in O(1), without reading & parsing the stored
  // blob.
  let isPersistingOwnValue = false

  // Value waiting to be persisted by the scheduled deferred flush.
  // `undefined` means no flush is scheduled.
  let pendingWrite: {value: A} | undefined

  const flushPendingWrite = (): void => {
    const toPersist = pendingWrite
    pendingWrite = undefined
    if (toPersist === undefined) return

    isPersistingOwnValue = true
    try {
      pipe(
        persistValue(toPersist.value),
        Either.getOrElse((l) => {
          reportError(
            'warn',
            new Error(`Error while saving value to storage. Key: ${key}`),
            {errorTag: l._tag}
          )
        })
      )
    } finally {
      isPersistingOwnValue = false
    }
  }

  // Cached module-eval read. Consumed (and freed, so the potentially large
  // raw string can be GCed) on first mount to avoid decoding the same blob
  // twice on startup.
  let initialRead: StoredRead<A> | undefined = getInitialValue({
    key,
    decodeRawValue,
    defaultValue,
  })

  const coreAtom = atom(initialRead.value)

  const mmkvAtom: PrimitiveAtom<A> = atom(
    (get) => get(coreAtom),
    (get, set, update: SetStateAction<A>): void => {
      const newValue = getValueFromSetStateActionOfAtom(update)(() =>
        get(coreAtom)
      )
      set(coreAtom, newValue)

      const flushAlreadyScheduled = pendingWrite !== undefined
      pendingWrite = {value: newValue}
      if (!flushAlreadyScheduled) {
        void InteractionManager.runAfterInteractions(flushPendingWrite)
      }
    }
  )

  mmkvAtom.debugLabel = `${
    debugLabel ?? ''
  }MMKV shadow atom for key ${key} ${mmkvAtom.toString()}`
  coreAtom.debugLabel = `${
    debugLabel ?? ''
  }MMKV core atom for key ${key} ${coreAtom.toString()}`

  coreAtom.onMount = (setAtom) => {
    // The value in storage might have changed between atom creation and mount
    // (the atom was not listening for changes yet). Re-decode only when the
    // raw stored string actually differs from the one already decoded at
    // creation time — on a normal startup it is identical and the second
    // decode is skipped entirely.
    const cachedInitialRead = initialRead
    initialRead = undefined

    if (
      cachedInitialRead === undefined ||
      readRawString(key) !== cachedInitialRead.raw
    ) {
      setAtom(getInitialValue({key, decodeRawValue, defaultValue}).value)
    }

    const listener = storage._storage.addOnValueChangedListener(
      (changedKey) => {
        if (changedKey === CLEAR_STORAGE_KEY) {
          console.info(`Setting MMKV atom with key '${key}' to default value`)
          setAtom(defaultValue)
          return
        }

        if (changedKey !== key) return

        // Own write — the atom already holds this value. Must be checked
        // synchronously (the listener runs inside our storage.set call).
        if (isPersistingOwnValue) return

        void InteractionManager.runAfterInteractions(() => {
          pipe(
            storage.getVerified(key, schema),
            Either.match({
              onLeft: (e) => {
                if (e._tag === 'ValueNotSet') {
                  console.info(
                    `MMKV value for key '${key}' was deleted. Setting atom to default value`
                  )
                  setAtom(defaultValue)
                  return
                }
                reportError(
                  'warn',
                  new Error(
                    `Error while parsing stored mmkv value in onChange function. Key: '${key}'`
                  ),
                  {errorTag: e._tag}
                )
              },
              onRight: setAtom,
            })
          )
        })
      }
    )

    return listener.remove
  }

  return mmkvAtom
}
