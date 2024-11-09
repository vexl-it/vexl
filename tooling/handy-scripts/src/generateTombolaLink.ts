import {FileSystem} from '@effect/platform'
import {NodeFileSystem, NodeRuntime} from '@effect/platform-node'
import {importKeyPair} from '@vexl-next/cryptography/src/KeyHolder'
import {
  PrivateKeyPemBase64E,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {eciesLegacyEncrypt} from '@vexl-next/cryptography/src/operations/eciesLegacy'
import {Array, Data, Effect, Schema, String, flow, pipe} from 'effect'
import {toFile} from 'qrcode'
import {fileURLToPath} from 'url'

const LIGHTNING_URL_PREFIX = 'lightning:'
const CSV_DELIMITER = '\n'

const privateKey = Schema.decode(PrivateKeyPemBase64E)(
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

export const program = Effect.gen(function* (_) {
  const csvFilePath = './inout/input.csv'
  const outputFilePath = './inout/output.csv'
  const outputQrcodeFolder = `./inout/qrcodes-${Date.now()}`
  const filesystem = yield* _(FileSystem.FileSystem)

  const {publicKeyPemBase64} = yield* _(keyHolder)
  yield* _(Effect.log(`Using ${publicKeyPemBase64}`))

  const encryptPayload = encryptPayloadWithkey(publicKeyPemBase64)

  const encryptlnurlToEncryptedDeepLink = (
    lnurl: string
  ): Effect.Effect<string, EncryptingError, never> =>
    pipe(
      `${LIGHTNING_URL_PREFIX}${lnurl}`,
      encryptPayload,
      Effect.flatMap(generateLink)
    )

  yield* _(filesystem.makeDirectory(outputQrcodeFolder))

  yield* _(Effect.log('Reading links from file and encrypting'))
  const links = yield* _(
    filesystem.readFileString(csvFilePath),
    // Encrpt links
    Effect.flatMap(
      flow(
        String.split(CSV_DELIMITER),
        Array.map(String.trim),
        Array.filter(String.isNonEmpty),
        Array.map(encryptlnurlToEncryptedDeepLink),
        Effect.allWith({concurrency: 'unbounded'})
      )
    )
  )
  yield* _(Effect.log('Done'))

  yield* _(Effect.log('Generating qrcodes'))
  yield* _(
    links,
    Array.map((link, i) =>
      generateQrcode(`${outputQrcodeFolder}/${i}.png`, link)
    ),
    Effect.allWith({concurrency: 'unbounded'})
  )
  yield* _(Effect.log('Done'))

  yield* _(Effect.log('Writing output file'))
  yield* _(
    filesystem.writeFileString(outputFilePath, Array.join(links, CSV_DELIMITER))
  )
  yield* _(Effect.log('Done'))
})

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  NodeRuntime.runMain(program.pipe(Effect.provide(NodeFileSystem.layer)))
}
