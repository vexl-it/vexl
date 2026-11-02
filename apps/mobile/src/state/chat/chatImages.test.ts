import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  aesGCMDecryptBytes,
  aesGCMEncryptBytes,
  generateAesKey,
} from '@vexl-next/cryptography/src/operations/aes'
import {
  type Chat,
  ChatImageAttachment,
  type ChatMessage,
  generateChatId,
  generateChatMessageId,
} from '@vexl-next/domain/src/general/messaging'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Deferred, Effect, Either, Schema} from 'effect'
import {createStore} from 'jotai'
import {
  ensureChatImageDownloadedActionAtom,
  uploadChatImageIfAnyActionAtom,
} from './chatImages'

const mockFiles = new Map<string, Uint8Array>()
const mockRequestChatImageDownload = jest.fn()
const mockRequestChatImageUpload = jest.fn()
const mockFetch = jest.fn()

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

    async bytes(): Promise<Uint8Array> {
      const bytes = mockFiles.get(this.uri)
      if (!bytes) throw new Error('Missing file')
      return bytes
    }

    write(bytes: Uint8Array): void {
      mockFiles.set(this.uri, bytes)
    }

    moveSync(destination: {uri: string}): void {
      const bytes = mockFiles.get(this.uri)
      if (!bytes) throw new Error('Missing file')
      mockFiles.delete(this.uri)
      mockFiles.set(destination.uri, bytes)
    }
  }

  return {
    Paths: {document: {uri: 'file://documents'}, cache: {uri: 'file://cache'}},
    Directory,
    File,
  }
})
jest.mock('expo/fetch', () => ({
  fetch: (...args: unknown[]) => mockFetch(...args),
}))
jest.mock('@bam.tech/react-native-image-resizer', () => ({
  __esModule: true,
  default: {
    createResizedImage: async () => ({
      uri: 'file://cache/resized.jpg',
      width: 4,
      height: 3,
    }),
  },
}))
jest.mock('../../api', () => ({
  apiAtom: jest.requireActual('jotai').atom({
    chat: {
      requestChatImageDownload: () => mockRequestChatImageDownload(),
      requestChatImageUpload: (request: unknown) =>
        mockRequestChatImageUpload(request),
    },
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
const downloadUrl = 'http://s3.test/download'
const encryptedImage = aesGCMEncryptBytes({data: image, key})

function s3Response(body: Uint8Array, status = 200): unknown {
  return {ok: status < 300, status, bytes: async () => body}
}

function ensureDownloaded(
  store: ReturnType<typeof createStore>
): Promise<Either.Either<string, {_tag: string}>> {
  return Effect.runPromise(
    store
      .set(ensureChatImageDownloadedActionAtom, {attachment, chatKeys})
      .pipe(Effect.either)
  )
}

beforeEach(() => {
  mockFiles.clear()
  mockRequestChatImageDownload.mockReset()
  mockRequestChatImageUpload.mockReset()
  mockFetch.mockReset()
  mockRequestChatImageDownload.mockReturnValue(Effect.succeed({downloadUrl}))
})

it('downloads and decrypts the image once for concurrent callers', async () => {
  const response = Effect.runSync(Deferred.make<{downloadUrl: string}>())
  mockRequestChatImageDownload.mockReturnValue(Deferred.await(response))
  mockFetch.mockResolvedValue(s3Response(encryptedImage))
  const store = createStore()

  const downloads = Promise.all([
    ensureDownloaded(store),
    ensureDownloaded(store),
  ])
  await Effect.runPromise(Deferred.succeed(response, {downloadUrl}))
  const [first, second] = await downloads

  expect(mockRequestChatImageDownload).toHaveBeenCalledTimes(1)
  expect(mockFetch).toHaveBeenCalledTimes(1)
  expect(mockFetch).toHaveBeenCalledWith(
    downloadUrl,
    expect.objectContaining({credentials: 'omit'})
  )
  expect(mockFetch.mock.calls[0][1].headers).toBeUndefined()
  expect(first).toEqual(second)
  const uri = Either.getOrThrow(first)
  expect(Buffer.from(mockFiles.get(uri) ?? []).equals(image)).toBe(true)
})

it('returns the stored file without downloading it again', async () => {
  mockFetch.mockResolvedValue(s3Response(encryptedImage))
  const store = createStore()

  await ensureDownloaded(store)
  await ensureDownloaded(store)

  expect(mockFetch).toHaveBeenCalledTimes(1)
})

it('fails without storing a file when S3 no longer has the image', async () => {
  mockFetch.mockResolvedValue(s3Response(new Uint8Array(), 403))

  const result = await ensureDownloaded(createStore())

  expect(result).toMatchObject({left: {_tag: 'ChatImageTransferError'}})
  expect(mockFiles.size).toBe(0)
})

it('retries a failed download on the next call', async () => {
  mockFetch
    .mockResolvedValueOnce(s3Response(new Uint8Array(3)))
    .mockResolvedValueOnce(s3Response(encryptedImage))
  const store = createStore()

  expect(Either.isLeft(await ensureDownloaded(store))).toBe(true)
  expect(mockFiles.size).toBe(0)
  expect(Either.isRight(await ensureDownloaded(store))).toBe(true)
})

it('uploads the encrypted bytes directly to the presigned url', async () => {
  const uploadUrl = 'http://s3.test/upload'
  const imageId = generateUuid()
  mockFiles.set('file://cache/resized.jpg', image)
  mockRequestChatImageUpload.mockReturnValue(
    Effect.succeed({imageId, uploadUrl})
  )
  mockFetch.mockResolvedValue(s3Response(new Uint8Array()))
  const inbox = {privateKey: generatePrivateKey()}
  const chat: Chat = {
    id: generateChatId(),
    inbox,
    otherSide: {publicKey: chatKeys.otherSideKey},
    origin: {type: 'unknown'},
    isUnread: false,
    showInfoBar: true,
    showVexlbotInitialMessage: true,
    showVexlbotNotifications: true,
  }
  const message: ChatMessage = {
    uuid: generateChatMessageId(),
    text: '',
    time: now(),
    image: Schema.decodeSync(UriString)('file://cache/picked.jpg'),
    senderPublicKey: inbox.privateKey.publicKeyPemBase64,
    messageType: 'MESSAGE',
  }

  const sent = await Effect.runPromise(
    createStore().set(uploadChatImageIfAnyActionAtom, {message, chat})
  )

  const [url, init] = mockFetch.mock.calls[0]
  expect(url).toBe(uploadUrl)
  expect(init).toMatchObject({
    method: 'PUT',
    credentials: 'omit',
    headers: {'Content-Type': 'application/octet-stream'},
  })
  expect(mockRequestChatImageUpload).toHaveBeenCalledWith(
    expect.objectContaining({size: init.body.byteLength})
  )
  expect(sent.image).toBeUndefined()
  expect(sent.imageAttachment?.id).toBe(imageId)
  const decrypted = aesGCMDecryptBytes({
    data: init.body,
    key: Buffer.from(sent.imageAttachment?.key ?? '', 'base64'),
  })
  expect(decrypted.equals(image)).toBe(true)
})
