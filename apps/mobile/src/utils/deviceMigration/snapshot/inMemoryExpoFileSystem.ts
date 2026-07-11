/**
 * Minimal in-memory fake of the expo-file-system 57 "new" API surface used
 * by the device migration snapshot modules. Used from jest tests via:
 *
 *     jest.mock('expo-file-system', () =>
 *       jest
 *         .requireActual('./inMemoryExpoFileSystem')
 *         .createInMemoryExpoFileSystem()
 *     )
 *
 * Not a test file itself (no `.test.ts` suffix) and never imported by
 * production code.
 */

export interface InMemoryFsState {
  readonly files: Map<string, Uint8Array>
  readonly directories: Set<string>
  availableDiskSpace: number
}

export interface InMemoryExpoFileSystem {
  readonly File: unknown
  readonly Directory: unknown
  readonly Paths: unknown
  readonly FileMode: Record<string, string>
  /** Test-only helpers, not part of the real module. */
  readonly __fsState: InMemoryFsState
  readonly __reset: () => void
  readonly __writeFile: (uri: string, bytes: Uint8Array) => void
  readonly __readFile: (uri: string) => Uint8Array | undefined
}

const DOCUMENT_ROOT = 'file:///documents'
const CACHE_ROOT = 'file:///caches'

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export function createInMemoryExpoFileSystem(): InMemoryExpoFileSystem {
  const state: InMemoryFsState = {
    files: new Map<string, Uint8Array>(),
    directories: new Set<string>([DOCUMENT_ROOT, CACHE_ROOT]),
    availableDiskSpace: Number.MAX_SAFE_INTEGER,
  }

  function join(...parts: string[]): string {
    const cleaned: string[] = []
    parts.forEach((part, index) => {
      const withoutTrailing = stripTrailingSlash(part)
      if (index === 0) {
        cleaned.push(withoutTrailing)
        return
      }
      cleaned.push(
        withoutTrailing.startsWith('/')
          ? withoutTrailing.slice(1)
          : withoutTrailing
      )
    })
    return cleaned.join('/')
  }

  function parentOf(path: string): string {
    const index = path.lastIndexOf('/')
    return index <= 'file://'.length ? path : path.slice(0, index)
  }

  function nameOf(path: string): string {
    const index = path.lastIndexOf('/')
    return index === -1 ? path : path.slice(index + 1)
  }

  function directoryExists(path: string): boolean {
    if (state.directories.has(path)) return true
    const prefix = `${path}/`
    for (const filePath of state.files.keys()) {
      if (filePath.startsWith(prefix)) return true
    }
    for (const directoryPath of state.directories) {
      if (directoryPath.startsWith(prefix)) return true
    }
    return false
  }

  function resolveUriParts(parts: unknown[]): string {
    const resolved = parts.map((part) => {
      if (typeof part === 'string') return part
      if (
        typeof part === 'object' &&
        part !== null &&
        'uri' in part &&
        typeof part.uri === 'string'
      )
        return part.uri
      throw new Error('Unsupported uri part')
    })
    if (resolved.length === 0) throw new Error('No uri given')
    const first = resolved[0]
    if (first === undefined) throw new Error('No uri given')
    return stripTrailingSlash(join(first, ...resolved.slice(1)))
  }

  class InMemoryFileHandle {
    private position = 0
    private readonly writeChunks: Uint8Array[] = []
    private open = true

    constructor(
      private readonly path: string,
      private readonly mode: string
    ) {}

    readBytes(length: number): Uint8Array {
      if (!this.open) throw new Error('handle closed')
      if (this.mode !== 'r' && this.mode !== 'rw')
        throw new Error('not readable')
      const data = state.files.get(this.path)
      if (data === undefined) throw new Error('file missing')
      const slice = data.slice(this.position, this.position + length)
      this.position += slice.length
      return slice
    }

    writeBytes(bytes: Uint8Array): void {
      if (!this.open) throw new Error('handle closed')
      if (this.mode === 'r') throw new Error('not writable')
      this.writeChunks.push(new Uint8Array(bytes))
      // Keep the stored file in sync on every write so a crash-simulating
      // test observes partially written data (like a real filesystem).
      this.flush()
    }

    private flush(): void {
      let total = 0
      for (const chunk of this.writeChunks) total += chunk.length
      const merged = new Uint8Array(total)
      let offset = 0
      for (const chunk of this.writeChunks) {
        merged.set(chunk, offset)
        offset += chunk.length
      }
      state.files.set(this.path, merged)
    }

    close(): void {
      this.open = false
    }
  }

  class InMemoryFile {
    readonly uri: string

    constructor(...uris: unknown[]) {
      this.uri = resolveUriParts(uris)
    }

    get name(): string {
      return nameOf(this.uri)
    }

    get exists(): boolean {
      return state.files.has(this.uri)
    }

    get size(): number {
      const data = state.files.get(this.uri)
      if (data === undefined) throw new Error('file missing')
      return data.length
    }

    create(options?: {intermediates?: boolean; overwrite?: boolean}): void {
      if (state.files.has(this.uri) && options?.overwrite !== true)
        throw new Error('file exists')
      const parent = parentOf(this.uri)
      if (!directoryExists(parent)) {
        if (options?.intermediates !== true)
          throw new Error('parent directory missing')
        state.directories.add(parent)
      }
      state.files.set(this.uri, new Uint8Array(0))
    }

    delete(): void {
      if (!state.files.has(this.uri)) throw new Error('file missing')
      state.files.delete(this.uri)
    }

    write(content: string | Uint8Array, _options?: {encoding?: string}): void {
      if (typeof content === 'string') {
        state.files.set(this.uri, new Uint8Array(Buffer.from(content, 'utf8')))
        return
      }
      state.files.set(this.uri, new Uint8Array(content))
    }

    copySync(destination: {uri: string}): void {
      const data = state.files.get(this.uri)
      if (data === undefined) throw new Error('file missing')
      state.files.set(stripTrailingSlash(destination.uri), new Uint8Array(data))
    }

    open(mode?: string): InMemoryFileHandle {
      const effectiveMode = mode ?? 'r'
      if (effectiveMode === 'r' || effectiveMode === 'rw') {
        if (!state.files.has(this.uri)) throw new Error('file missing')
      } else {
        // Write modes truncate.
        state.files.set(this.uri, new Uint8Array(0))
      }
      return new InMemoryFileHandle(this.uri, effectiveMode)
    }
  }

  class InMemoryDirectory {
    private readonly path: string

    constructor(...uris: unknown[]) {
      this.path = resolveUriParts(uris)
    }

    get uri(): string {
      return `${this.path}/`
    }

    get name(): string {
      return nameOf(this.path)
    }

    get exists(): boolean {
      return directoryExists(this.path)
    }

    create(options?: {
      intermediates?: boolean
      overwrite?: boolean
      idempotent?: boolean
    }): void {
      if (directoryExists(this.path)) {
        if (options?.idempotent === true || options?.overwrite === true) return
        throw new Error('directory exists')
      }
      const parent = parentOf(this.path)
      if (!directoryExists(parent)) {
        if (options?.intermediates !== true)
          throw new Error('parent directory missing')
        let current = parent
        const missing: string[] = []
        while (!directoryExists(current)) {
          missing.push(current)
          current = parentOf(current)
        }
        for (const directoryPath of missing)
          state.directories.add(directoryPath)
      }
      state.directories.add(this.path)
    }

    delete(): void {
      if (!directoryExists(this.path)) throw new Error('directory missing')
      const prefix = `${this.path}/`
      for (const filePath of [...state.files.keys()]) {
        if (filePath.startsWith(prefix)) state.files.delete(filePath)
      }
      for (const directoryPath of [...state.directories]) {
        if (directoryPath === this.path || directoryPath.startsWith(prefix))
          state.directories.delete(directoryPath)
      }
    }

    list(): Array<InMemoryDirectory | InMemoryFile> {
      if (!directoryExists(this.path)) throw new Error('directory missing')
      const prefix = `${this.path}/`
      const fileNames = new Set<string>()
      const directoryNames = new Set<string>()

      for (const filePath of state.files.keys()) {
        if (!filePath.startsWith(prefix)) continue
        const remainder = filePath.slice(prefix.length)
        const slashIndex = remainder.indexOf('/')
        if (slashIndex === -1) fileNames.add(remainder)
        else directoryNames.add(remainder.slice(0, slashIndex))
      }
      for (const directoryPath of state.directories) {
        if (!directoryPath.startsWith(prefix)) continue
        const remainder = directoryPath.slice(prefix.length)
        const slashIndex = remainder.indexOf('/')
        directoryNames.add(
          slashIndex === -1 ? remainder : remainder.slice(0, slashIndex)
        )
      }

      return [
        ...[...directoryNames]
          .sort()
          .map((name) => new InMemoryDirectory(`${prefix}${name}`)),
        ...[...fileNames]
          .sort()
          .map((name) => new InMemoryFile(`${prefix}${name}`)),
      ]
    }
  }

  const Paths = {
    get document(): InMemoryDirectory {
      return new InMemoryDirectory(DOCUMENT_ROOT)
    },
    get cache(): InMemoryDirectory {
      return new InMemoryDirectory(CACHE_ROOT)
    },
    get availableDiskSpace(): number {
      return state.availableDiskSpace
    },
    join,
    info(...uris: string[]) {
      const path = stripTrailingSlash(join(...uris))
      if (state.files.has(path)) return {exists: true, isDirectory: false}
      if (directoryExists(path)) return {exists: true, isDirectory: true}
      return {exists: false, isDirectory: null}
    },
  }

  const FileMode = {
    ReadWrite: 'rw',
    ReadOnly: 'r',
    WriteOnly: 'w',
    Append: 'wa',
    Truncate: 'wt',
  }

  return {
    File: InMemoryFile,
    Directory: InMemoryDirectory,
    Paths,
    FileMode,
    __fsState: state,
    __reset: () => {
      state.files.clear()
      state.directories.clear()
      state.directories.add(DOCUMENT_ROOT)
      state.directories.add(CACHE_ROOT)
      state.availableDiskSpace = Number.MAX_SAFE_INTEGER
    },
    __writeFile: (uri: string, bytes: Uint8Array) => {
      const path = stripTrailingSlash(uri)
      state.directories.add(parentOf(path))
      let current = parentOf(path)
      while (!directoryExists(parentOf(current)) && current.includes('/')) {
        state.directories.add(parentOf(current))
        current = parentOf(current)
      }
      state.files.set(path, new Uint8Array(bytes))
    },
    __readFile: (uri: string) => state.files.get(stripTrailingSlash(uri)),
  }
}
