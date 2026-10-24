import {Array, Option, pipe} from 'effect'

export interface VideoFormat {
  readonly width: number
  readonly height: number
}

export interface Recording {
  readonly blob: Blob
  readonly extension: 'mp4' | 'webm'
}

const fps = 30
const bitsPerSecond = 8_000_000

// Chrome encodes mp4 since version 126; older browsers fall back to webm.
const pickMimeType = (): string =>
  pipe(
    [
      'video/mp4;codecs=avc1.640034',
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm',
    ],
    Array.findFirst((type) => MediaRecorder.isTypeSupported(type)),
    Option.getOrElse(() => 'video/webm')
  )

// Tab capture only exists in secure contexts of Chromium browsers.
export const canRecordTab =
  typeof CropTarget !== 'undefined' &&
  'mediaDevices' in navigator &&
  'getDisplayMedia' in navigator.mediaDevices &&
  typeof MediaRecorder !== 'undefined'

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/** Asks to share the current tab; resolves once the person picks it. */
export const captureCurrentTab = (): Promise<MediaStream> =>
  navigator.mediaDevices.getDisplayMedia({
    video: {frameRate: {ideal: 60}},
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
  })

/**
 * Records `element` out of the shared tab, scaled to `format`. The element must have the
 * format's aspect ratio and stay on screen. `play` starts what is recorded and resolves when
 * it ends; ending the tab share stops early.
 */
export async function recordElement({
  tab,
  element,
  format,
  play,
}: {
  tab: MediaStream
  element: HTMLElement
  format: VideoFormat
  play: () => Promise<void>
}): Promise<Recording> {
  const [track] = tab.getVideoTracks()
  let frame = 0
  try {
    if (!track || typeof CropTarget === 'undefined') {
      throw new Error('Tab capture is not available')
    }
    await track.cropTo(await CropTarget.fromElement(element))

    const video = document.createElement('video')
    video.muted = true
    video.srcObject = tab
    await video.play()

    const canvas = document.createElement('canvas')
    canvas.width = format.width
    canvas.height = format.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is not available')
    // Tab capture sends frames only when the page changes; redraw every frame for a steady video.
    const draw = (): void => {
      context.drawImage(video, 0, 0, format.width, format.height)
      frame = requestAnimationFrame(draw)
    }
    draw()
    // Let the crop reach the video before the first recorded frame.
    await sleep(600)

    const mimeType = pickMimeType()
    const recorder = new MediaRecorder(canvas.captureStream(fps), {
      mimeType,
      videoBitsPerSecond: bitsPerSecond,
    })
    const chunks: Blob[] = []
    recorder.ondataavailable = (event) => {
      chunks.push(event.data)
    }
    const stopped = new Promise((resolve) => {
      recorder.onstop = resolve
    })
    const shareEnded = new Promise<void>((resolve) => {
      track.addEventListener('ended', () => {
        resolve()
      })
    })

    recorder.start()
    await Promise.race([play(), shareEnded])
    recorder.stop()
    await stopped
    return {
      blob: new Blob(chunks, {type: mimeType}),
      extension: mimeType.startsWith('video/mp4') ? 'mp4' : 'webm',
    }
  } finally {
    cancelAnimationFrame(frame)
    Array.forEach(tab.getTracks(), (each) => {
      each.stop()
    })
  }
}

export function download({blob, extension}: Recording, name: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${name}.${extension}`
  link.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}
