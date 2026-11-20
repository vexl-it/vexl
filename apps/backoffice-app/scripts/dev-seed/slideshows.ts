/**
 * Seeds TV slideshows with uploaded media. Run from the repo root:
 * pnpm exec tsx apps/backoffice-app/scripts/dev-seed/slideshows.ts
 */
import {Array, pipe, Schema, String} from 'effect'
import {randomUUID} from 'node:crypto'
import {
  SlideshowListResponse,
  type SlideshowSlide,
} from '../../src/services/slideshows/domain'
import {RequestUploadResponse} from '../../src/services/uploadToPresignedUrl'
import {BACKOFFICE_URL, psql, rgbPng, type Rgb} from './shared'

// Slides are a letter and the seconds on screen: i = image, c = image shown
// whole (contain), v = video, w = website.
const SLIDESHOWS = [
  {
    name: 'Prague meetup lobby',
    publicSlug: 'prague-lobby',
    isEnabled: true,
    updatedDaysAgo: 0,
    slides: 'i10 i10 c20 v4 i15 i15 i8 w60 i12 i12 i30 v10 i45',
  },
  {
    name: 'Welcome screen',
    publicSlug: null,
    isEnabled: true,
    updatedDaysAgo: 3,
    slides: 'i3600',
  },
  {
    name: 'Conference booth 2027 (draft)',
    publicSlug: null,
    isEnabled: false,
    updatedDaysAgo: 1,
    slides: '',
  },
  {
    name: 'Reception TV',
    publicSlug: 'reception',
    isEnabled: true,
    updatedDaysAgo: 2,
    slides: '',
  },
  {
    name: 'Office kitchen',
    publicSlug: 'office-kitchen',
    isEnabled: true,
    updatedDaysAgo: 12,
    slides: 'i20 i20 v4 i90',
  },
  {
    name: 'Vexl community meetup Brno: sponsors, schedule and wifi instructions for the winter edition',
    publicSlug: 'brno-meetup-winter',
    isEnabled: false,
    updatedDaysAgo: 140,
    slides: 'i15 i15 i15 i25 i15',
  },
  {
    name: 'Website dashboards',
    publicSlug: 'dashboards',
    isEnabled: true,
    updatedDaysAgo: 45,
    slides: 'w300 w120',
  },
  {
    name: 'Shop window videos',
    publicSlug: null,
    isEnabled: true,
    updatedDaysAgo: 400,
    slides: 'v4 v4',
  },
  {
    name: 'TV',
    publicSlug: null,
    isEnabled: true,
    updatedDaysAgo: 75,
    slides: 'i5 c5',
  },
]

const COLORS: readonly Rgb[] = [
  [252, 205, 108],
  [240, 126, 70],
  [78, 205, 196],
  [84, 132, 227],
  [155, 107, 223],
  [124, 201, 107],
]

// 3x5 pixel digits, row by row.
const DIGITS = [
  '111101101101111',
  '010110010010111',
  '111001111100111',
  '111001111001111',
  '101101111001001',
  '111100111001111',
  '111100111101111',
  '111001001001001',
  '111101111101111',
  '111101111001111',
]

/** A gradient with the slide number on it, so slides are easy to tell apart. */
const numberedPng = (
  number: number,
  colorShift: number,
  width: number
): Buffer => {
  const height = 540
  const [red, green, blue] = COLORS[(number + colorShift) % COLORS.length] ?? [
    0, 0, 0,
  ]
  const digits = `${number}`
  const cell = Math.floor(height / 9)
  const left = Math.floor((width - (digits.length * 4 - 1) * cell) / 2)
  const top = 2 * cell
  const isDigit = (x: number, y: number): boolean => {
    const column = Math.floor((x - left) / cell)
    const row = Math.floor((y - top) / cell)
    if (column < 0 || row < 0 || row > 4 || column % 4 === 3) return false
    const glyph = DIGITS[Number(digits[Math.floor(column / 4)])]
    return glyph?.[row * 3 + (column % 4)] === '1'
  }

  return rgbPng(width, height, (x, y) => {
    if (isDigit(x, y)) return [255, 255, 255]
    const shade = 1 - 0.4 * (x / width + y / height)
    return [red * shade, green * shade, blue * shade]
  })
}

// Four seconds of yellow fading to black, 320x180 VP9.
const VIDEO = Buffer.from(
  'GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAL4EU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHWTbuMU6uEElTDZ1OsggE3TbuMU6uEHFO7a1OsggLi7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsCrXsYMPQkBNgIxMYXZmNjMuMS4xMDJXQYxMYXZmNjMuMS4xMDJEiYhAr0AAAAAAABZUrmvcrgEAAAAAAABT14EBc8WInIzzKPPtZZmcgQAitZyDdW5kiIEAhoVWX1ZQOYOBASPjg4QdzWUA4JWwggFAuoG0moECVbCIVbGBAFW5gQJV7oEA7AEAAAAAAAACAAASVMNn/nNzn2PAgGfImUWjh0VOQ09ERVJEh4xMYXZmNjMuMS4xMDJzc9ljwItjxYicjPMo8+1lmWfIpEWjh0VOQ09ERVJEh5dMYXZjNjMuMS4xMDIgbGlidnB4LXZwOWfIoUWjiERVUkFUSU9ORIeTMDA6MDA6MDQuMDAwMDAwMDAwAB9DtnVBIueBAKOtgQAAgKJJg0LgE/ALNgA4JBwZTgAAgGH2MGgde0AAZXHzBTDikxPaGjVJD8AAo6KBAfQApgBAknABeAAADGAAAABSRAABrMsH/UiUEMIvGeMAo6CBA+gApgBAknABdAAADGAAAABNjAADYq5I4i2G/WVHAKOggQXcAKYAQJJwAXgAAAxgAAAAQwAALPGMspyris4LxGCjoIEH0ACmAECScAFvAAAMYAAAAEoKAAboHAYIghhF4zxgo6CBCcQApgBAknABeAAADGAAAABPaAADbpWpphxTKlhguKOggQu4AKYAQJJwAXQAAAxgAAAAW28AAbrhv8CqDFPFJYCjoIENrACmAECScAF4AAAMYAAAAF3GAAG6VutUS5Pr+OEAHFO7a5G7j7OBALeK94EB8YIBuvCBAw==',
  'base64'
)

const api = async (path: string, body?: unknown): Promise<unknown> => {
  const response = await fetch(
    `${BACKOFFICE_URL}/api/admin/slideshows${path}`,
    {
      method: body === undefined ? 'GET' : 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(body),
    }
  )
  if (!response.ok)
    throw new Error(
      `${path} failed: ${response.status} ${await response.text()}`
    )
  return await response.json()
}

const upload = async (
  slideshowUuid: string,
  fileExtension: 'png' | 'webm',
  file: Buffer
) => {
  const {presignedUrl, contentType, assetUrl, s3Key} = Schema.decodeUnknownSync(
    RequestUploadResponse
  )(await api('/request-upload', {slideshowUuid, fileExtension}))
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {'content-type': contentType},
    body: new Uint8Array(file),
  })
  if (!response.ok) throw new Error(`Upload failed: ${response.status}`)
  return {url: assetUrl, s3Key}
}

const seedSlide = async (
  slideshowUuid: string,
  code: string,
  index: number,
  colorShift: number
): Promise<SlideshowSlide> => {
  const base = {uuid: randomUUID(), durationSeconds: Number(code.slice(1))}
  const kind = code.charAt(0)
  if (kind === 'w')
    return {...base, type: 'website', url: 'https://example.com'}
  if (kind === 'v') {
    const media = await upload(slideshowUuid, 'webm', VIDEO)
    return {...base, ...media, type: 'video'}
  }

  const fit = kind === 'c' ? 'contain' : 'cover'
  const png = numberedPng(index + 1, colorShift, fit === 'contain' ? 540 : 960)
  const media = await upload(slideshowUuid, 'png', png)
  return {...base, ...media, type: 'image', fit}
}

// The API always stamps "now", and the list needs old and recent rows.
const backdate = (uuid: string, updatedDaysAgo: number): void => {
  psql(
    'backoffice',
    `UPDATE backoffice_tv_slideshows
     SET updated_at = now() - interval '${updatedDaysAgo} days',
         created_at = now() - interval '${updatedDaysAgo + 20} days'
     WHERE uuid = '${uuid}'`
  )
}

const seed = async (): Promise<void> => {
  const existingNames = pipe(
    Schema.decodeUnknownSync(SlideshowListResponse)(await api('')).slideshows,
    Array.map(({name}) => name)
  )

  for (const [position, slideshow] of SLIDESHOWS.entries()) {
    const {slides, updatedDaysAgo, ...details} = slideshow
    if (Array.contains(existingNames, details.name)) {
      console.log(`exists   ${details.name}`)
      continue
    }

    const uuid = randomUUID()
    const codes = Array.filter(slides.split(' '), String.isNonEmpty)
    await api('', {
      ...details,
      uuid,
      slides: await Promise.all(
        Array.map(codes, (code, index) =>
          seedSlide(uuid, code, index, position)
        )
      ),
    })
    if (updatedDaysAgo > 0) backdate(uuid, updatedDaysAgo)
    console.log(`created  ${details.name} (${codes.length} slides)`)
  }
}

void seed()
