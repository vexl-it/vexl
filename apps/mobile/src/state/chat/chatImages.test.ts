import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  aesGCMEncryptBytes,
  generateAesKey,
} from '@vexl-next/cryptography/src/operations/aes'
import {ChatImageAttachment} from '@vexl-next/domain/src/general/messaging'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Deferred, Effect, Either, Schema} from 'effect'
import {createStore} from 'jotai'
import {ensureChatImageDownloadedActionAtom} from './chatImages'

const mockFiles = new Map<string, Uint8Array>()
const mockDownloadChatImage = jest.fn()

jest.mock('expo-file-system', () => {
  const join = (parts: Array<string | {uri: string}>): string =>
    parts.map((one) => (typeof one === 'string' ? one : one.uri)).join('/')

  class Directory {
    readonly uri: string
    constructor(...parts: Array<string | {uri: string}>) {
      this.uri = join(parts)
    }

    create(): void {}
  }

  class File {
    readonly uri: string
    constructor(...parts: Array<string | {uri: string}>) {
      this.uri = join(parts)
    }

    get exists(): boolean {
      return mockFiles.has(this.uri)
    }

    get parentDirectory(): Directory {
      return new Directory(this.uri.slice(0, this.uri.lastIndexOf('/')))
    }

    write(bytes: Uint8Array): void {
      mockFiles.set(this.uri, bytes)
    }
  }

  return {Paths: {document: {uri: 'file://documents'}}, Directory, File}
})
jest.mock('../../api', () => ({
  apiAtom: jest.requireActual('jotai').atom({
    chat: {downloadChatImage: () => mockDownloadChatImage()},
  }),
}))
jest.mock('../../utils/reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const image = Buffer.from('plaintext image bytes')
const key = generateAesKey()
const attachment = Schema.decodeSync(ChatImageAttachment)({
  id: generateUuid(),
  key: key.toString('base64'),
  width: 4,
  height: 3,
})
const chatKeys = {
  inboxKey: generatePrivateKey().publicKeyPemBase64,
  otherSideKey: generatePrivateKey().publicKeyPemBase64,
}
const encryptedResponse = {
  data: aesGCMEncryptBytes({data: image, key}).toString('base64'),
}

function ensureDownloaded(
  store: ReturnType<typeof createStore>
): Promise<Either.Either<string, unknown>> {
  return Effect.runPromise(
    store
      .set(ensureChatImageDownloadedActionAtom, {attachment, chatKeys})
      .pipe(Effect.either)
  )
}

beforeEach(() => {
  mockFiles.clear()
  mockDownloadChatImage.mockReset()
})

it('downloads and decrypts the image once for concurrent callers', async () => {
  const response = Effect.runSync(Deferred.make<typeof encryptedResponse>())
  mockDownloadChatImage.mockReturnValue(Deferred.await(response))
  const store = createStore()

  const downloads = Promise.all([
    ensureDownloaded(store),
    ensureDownloaded(store),
  ])
  await Effect.runPromise(Deferred.succeed(response, encryptedResponse))
  const [first, second] = await downloads

  expect(mockDownloadChatImage).toHaveBeenCalledTimes(1)
  expect(first).toEqual(second)
  const uri = Either.getOrThrow(first)
  expect(Buffer.from(mockFiles.get(uri) ?? []).equals(image)).toBe(true)
})

it('returns the stored file without downloading it again', async () => {
  mockDownloadChatImage.mockReturnValue(Effect.succeed(encryptedResponse))
  const store = createStore()

  await ensureDownloaded(store)
  await ensureDownloaded(store)

  expect(mockDownloadChatImage).toHaveBeenCalledTimes(1)
})

it('retries a failed download on the next call', async () => {
  mockDownloadChatImage
    .mockReturnValueOnce(Effect.succeed({data: 'AAAA'}))
    .mockReturnValueOnce(Effect.succeed(encryptedResponse))
  const store = createStore()

  expect(Either.isLeft(await ensureDownloaded(store))).toBe(true)
  expect(mockFiles.size).toBe(0)
  expect(Either.isRight(await ensureDownloaded(store))).toBe(true)
})
