import {Array, pipe} from 'effect'
import {execFileSync} from 'node:child_process'
import {crc32, deflateSync} from 'node:zlib'

/** Where the local dev stack lives, shared by every dev seed script. */
export const BACKOFFICE_URL =
  process.env.BACKOFFICE_URL ?? 'http://localhost:3011'
export const CONTACT_INTERNAL_URL =
  process.env.CONTACT_INTERNAL_SERVER_URL ?? 'http://localhost:3017'
export const CONTENT_INTERNAL_URL =
  process.env.CONTENT_INTERNAL_SERVER_URL ?? 'http://localhost:3018'
export const CONTENT_URL =
  process.env.CONTENT_API_INTERNAL_URL ?? 'http://localhost:3009'
export const RESOURCES_BASE_URL =
  process.env.RESOURCES_BASE_URL ?? 'http://localhost:9000/vexl-resources'

export const ADMIN_TOKEN_HEADERS = {'x-admin-token': 'dev'}

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '[::1]']

const isLocal = (url: string): boolean =>
  Array.contains(LOCAL_HOSTNAMES, new URL(url).hostname)

const remoteUrls = pipe(
  [
    BACKOFFICE_URL,
    CONTACT_INTERNAL_URL,
    CONTENT_INTERNAL_URL,
    CONTENT_URL,
    RESOURCES_BASE_URL,
  ],
  Array.filter((url) => !isLocal(url))
)

if (Array.isNonEmptyArray(remoteUrls)) {
  throw new Error(
    `Dev seeds only run against a local stack, refusing: ${remoteUrls.join(', ')}`
  )
}

/** A presigned URL comes from the stack, so the check above has not seen it. */
export const putToLocalStorage = async (
  presignedUrl: string,
  contentType: string,
  body: Uint8Array<ArrayBuffer>
): Promise<void> => {
  if (!isLocal(presignedUrl)) {
    throw new Error(
      `Dev seeds only upload to a local stack, not ${new URL(presignedUrl).hostname}`
    )
  }
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {'Content-Type': contentType},
    body,
    redirect: 'error',
  })
  if (!response.ok) throw new Error(`Upload failed: ${response.status}`)
}

/** Runs SQL in one transaction against a database of the dev Postgres container. */
export const psql = (database: string, sql: string): void => {
  execFileSync(
    'docker',
    [
      ...['exec', '-i', 'vexl-postgres', 'psql', '-q', '-U', 'postgres'],
      ...['-d', database, '-v', 'ON_ERROR_STOP=1', '--single-transaction'],
    ],
    {input: sql, stdio: ['pipe', 'inherit', 'inherit']}
  )
}

export type Rgb = readonly [number, number, number]

const uint32 = (value: number): Buffer => {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32BE(value)
  return buffer
}

const pngChunk = (type: string, data: Buffer): Buffer => {
  const body = Buffer.concat([Buffer.from(type), data])
  return Buffer.concat([uint32(data.length), body, uint32(crc32(body))])
}

/** An 8-bit RGB PNG; channels above 255 wrap around, so clamp them. */
export const rgbPng = (
  width: number,
  height: number,
  pixelAt: (x: number, y: number) => Rgb
): Buffer<ArrayBuffer> => {
  const stride = width * 3 + 1
  const pixels = Buffer.alloc(height * stride)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      pixels.set(pixelAt(x, y), y * stride + 1 + x * 3)
    }
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk(
      'IHDR',
      Buffer.concat([
        uint32(width),
        uint32(height),
        Buffer.from([8, 2, 0, 0, 0]),
      ])
    ),
    pngChunk('IDAT', deflateSync(pixels)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}
