import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem'
import * as NodeRuntime from '@effect/platform-node/NodeRuntime'
import {importKeyPair} from '@vexl-next/cryptography/src/KeyHolder'
import {
  PrivateKeyPemBase64,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {eciesLegacyEncrypt} from '@vexl-next/cryptography/src/operations/eciesLegacy'
import {
  Array,
  Data,
  Effect,
  FileSystem,
  Schema,
  String,
  flow,
  pipe,
} from 'effect'
import {toFile} from 'qrcode'
import {fileURLToPath} from 'url'

const LIGHTNING_URL_PREFIX = 'lightning:'
const CSV_DELIMITER = '\n'

const privateKey = Schema.decodeEffect(PrivateKeyPemBase64)(
  'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JR0VBZ0VBTUJBR0J5cUdTTTQ5QWdFR0JTdUJCQUFLQkcwd2F3SUJBUVFndWIyTDJaMFd5YVhvSVZmaUk3b3IKUFZTK2JTOGpGUXpVaUxvUkNjT2N3MnFoUkFOQ0FBU1c2USs4NXRQQ3RjMDFMdU5nZUVMY3ZIZGlDbmErMThOdwpWanpVUXc2T3RvbDdvWW5BMUVzR2tWOUZqdUVURzJzSTBIdG1RQmk0eFlXT3VQVTdRYmNvCi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K'
)

const keyHolder = privateKey.pipe(Effect.map(importKeyPair))

const generateLink = (payload: string): Effect.Effect<string> =>
  Effect.sync(() => {
    const innerLink = `https://vexl.it?type=encrypted-url&data=${encodeURIComponent(
      payload
    )}`
    const innerLinkEncoded = encodeURIComponent(innerLink)

    return `https://link.vexl.it/?link=${innerLinkEncoded}&apn=it.vexl.next&isi=6448051657&ibi=it.vexl.next&efr=1&ifl=https%3A%2F%2Fvexl.it%2Fdownload`
  })

export class EncryptingError extends Data.TaggedError('EncryptingError')<{
  originalData: unknown
}> {}

const encryptPayloadWithkey =
  (publicKey: PublicKeyPemBase64) =>
  (payload: string): Effect.Effect<string, EncryptingError> =>
    Effect.tryPromise({
      try: async () => await eciesLegacyEncrypt({publicKey, data: payload}),
      catch: (e) => new EncryptingError({originalData: e}),
    })

export class GeneratingQrCodeError extends Data.TaggedError(
  'GeneratingQrCodeError'
)<{
  originalData: unknown
}> {}

const generateQrcode = (
  path: string,
  data: string
): Effect.Effect<void, GeneratingQrCodeError> =>
  Effect.tryPromise({
    try: async () => {
      await toFile(path, data)
    },
    catch: (e) => new GeneratingQrCodeError({originalData: e}),
  })

export const program = Effect.gen(function* () {
  const csvFilePath = './inout/input.csv'
  const outputFilePath = './inout/output.csv'
  const outputQrcodeFolder = `./inout/qrcodes-${Date.now()}`
  const filesystem = yield* FileSystem.FileSystem

  const {publicKeyPemBase64} = yield* keyHolder
  yield* Effect.log(`Using ${publicKeyPemBase64}`)

  const encryptPayload = encryptPayloadWithkey(publicKeyPemBase64)

  const encryptlnurlToEncryptedDeepLink = (
    lnurl: string
  ): Effect.Effect<string, EncryptingError, never> =>
    pipe(
      `${LIGHTNING_URL_PREFIX}${lnurl}`,
      encryptPayload,
      Effect.flatMap(generateLink)
    )

  yield* filesystem.makeDirectory(outputQrcodeFolder)

  yield* Effect.log('Reading links from file and encrypting')
  const links = yield* pipe(
    filesystem.readFileString(csvFilePath),
    Effect.flatMap(
      flow(
        String.split(CSV_DELIMITER),
        Array.map(String.trim),
        Array.filter(String.isNonEmpty),
        Array.map(encryptlnurlToEncryptedDeepLink),
        (effects) => Effect.all(effects, {concurrency: 'unbounded'})
      )
    )
  )
  yield* Effect.log('Done')

  yield* Effect.log('Generating qrcodes')
  yield* pipe(
    links,
    Array.map((link, i) =>
      generateQrcode(`${outputQrcodeFolder}/${i}.png`, link)
    ),
    (effects) => Effect.all(effects, {concurrency: 'unbounded'})
  )
  yield* Effect.log('Done')

  yield* Effect.log('Writing output file')
  yield* filesystem.writeFileString(
    outputFilePath,
    Array.join(links, CSV_DELIMITER)
  )
  yield* Effect.log('Done')
})

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  NodeRuntime.runMain(program.pipe(Effect.provide(NodeFileSystem.layer)))
}
