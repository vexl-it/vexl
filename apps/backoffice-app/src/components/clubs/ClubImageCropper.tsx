'use client'

import {Alert, Button, Modal} from '@/src/components/ui'
import {useRef, useState, type KeyboardEvent, type PointerEvent} from 'react'

/** The app shows club images as squares up to 140 pt wide, i.e. 420 px at @3x. */
const OUTPUT_SIZE_PX = 512
const VIEWPORT_SIZE_PX = 288
const MAX_ZOOM = 4
const KEYBOARD_PAN_PX = 10
const JPEG_QUALITY = 0.9

/** A square crop in source image pixels. */
interface Crop {
  readonly zoom: number
  readonly centerX: number
  readonly centerY: number
}

export interface ImageToCrop {
  readonly file: File
  readonly image: HTMLImageElement
}

export const loadImageToCrop = (file: File): Promise<ImageToCrop> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      resolve({file, image})
    }
    image.onerror = () => {
      URL.revokeObjectURL(image.src)
      reject(new Error('The browser cannot open this file as an image.'))
    }
    image.src = URL.createObjectURL(file)
  })

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

const cropSide = (image: HTMLImageElement, zoom: number): number =>
  Math.min(image.naturalWidth, image.naturalHeight) / zoom

const clampCrop = (image: HTMLImageElement, crop: Crop): Crop => {
  const half = cropSide(image, crop.zoom) / 2
  return {
    zoom: crop.zoom,
    centerX: clamp(crop.centerX, half, image.naturalWidth - half),
    centerY: clamp(crop.centerY, half, image.naturalHeight - half),
  }
}

const panCrop = (
  image: HTMLImageElement,
  crop: Crop,
  deltaX: number,
  deltaY: number
): Crop => {
  const sourcePxPerViewportPx = cropSide(image, crop.zoom) / VIEWPORT_SIZE_PX
  return clampCrop(image, {
    ...crop,
    centerX: crop.centerX - deltaX * sourcePxPerViewportPx,
    centerY: crop.centerY - deltaY * sourcePxPerViewportPx,
  })
}

const KEYBOARD_PAN: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-KEYBOARD_PAN_PX, 0],
  ArrowRight: [KEYBOARD_PAN_PX, 0],
  ArrowUp: [0, -KEYBOARD_PAN_PX],
  ArrowDown: [0, KEYBOARD_PAN_PX],
}

/** JPEG has no transparency to lose; everything else stays PNG to keep it. */
const outputType = (file: File): 'image/png' | 'image/jpeg' =>
  file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png'

const renderCrop = async (
  {file, image}: ImageToCrop,
  crop: Crop
): Promise<File> => {
  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE_PX
  canvas.height = OUTPUT_SIZE_PX
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot crop images.')

  const side = cropSide(image, crop.zoom)
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image,
    crop.centerX - side / 2,
    crop.centerY - side / 2,
    side,
    side,
    0,
    0,
    OUTPUT_SIZE_PX,
    OUTPUT_SIZE_PX
  )

  const type = outputType(file)
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, JPEG_QUALITY)
  })
  if (!blob) throw new Error('Failed to crop the image.')
  return new File([blob], type === 'image/png' ? 'club.png' : 'club.jpg', {
    type,
  })
}

/** Crops and resizes a club image to the square the app displays. */
export function ClubImageCropper({
  source,
  onCancel,
  onCropped,
}: {
  readonly source: ImageToCrop
  readonly onCancel: () => void
  readonly onCropped: (file: File) => void
}) {
  const {image} = source
  const [crop, setCrop] = useState<Crop>({
    zoom: 1,
    centerX: image.naturalWidth / 2,
    centerY: image.naturalHeight / 2,
  })
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const dragStart = useRef<{
    readonly x: number
    readonly y: number
    readonly crop: Crop
  } | null>(null)

  const side = cropSide(image, crop.zoom)
  const scale = VIEWPORT_SIZE_PX / side

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStart.current = {x: event.clientX, y: event.clientY, crop}
  }
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current
    if (!start) return
    setCrop(
      panCrop(
        image,
        start.crop,
        event.clientX - start.x,
        event.clientY - start.y
      )
    )
  }
  const handlePointerEnd = () => {
    dragStart.current = null
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = KEYBOARD_PAN[event.key]
    if (!delta) return
    event.preventDefault()
    setCrop((current) => panCrop(image, current, ...delta))
  }

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      onCropped(await renderCrop(source, crop))
    } catch (cropError) {
      setError(
        cropError instanceof Error ? cropError.message : 'Failed to crop.'
      )
      setConfirming(false)
    }
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title="Crop club image"
      description={`Drag to move, use the slider to zoom. The image is saved as a ${OUTPUT_SIZE_PX} × ${OUTPUT_SIZE_PX} px square; the app rounds its corners.`}
      footer={
        <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            variant="primary"
            loading={confirming}
            onClick={() => {
              void handleConfirm()
            }}
          >
            Use image
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <div
          role="application"
          aria-label="Crop area. Use the arrow keys to move the image."
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onKeyDown={handleKeyDown}
          style={{width: VIEWPORT_SIZE_PX, height: VIEWPORT_SIZE_PX}}
          className="relative shrink-0 cursor-move touch-none overflow-hidden rounded-control bg-canvas select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <img
            src={image.src}
            alt=""
            draggable={false}
            style={{
              width: image.naturalWidth * scale,
              height: image.naturalHeight * scale,
              transform: `translate(${-(crop.centerX - side / 2) * scale}px, ${-(crop.centerY - side / 2) * scale}px)`,
            }}
            className="absolute top-0 left-0 max-w-none"
          />
          <div className="pointer-events-none absolute inset-0 rounded-[20%] shadow-[0_0_0_9999px_rgb(0_0_0/0.4)]" />
        </div>
        <label className="flex w-full items-center gap-3">
          <span className="font-semibold">Zoom</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={crop.zoom}
            onChange={(event) => {
              const zoom = Number(event.target.value)
              setCrop((current) => clampCrop(image, {...current, zoom}))
            }}
            className="flex-1 accent-accent"
          />
        </label>
        {side < OUTPUT_SIZE_PX ? (
          <Alert tone="warning" className="w-full">
            This area is only {Math.round(side)} px wide, so it may look blurry
            in the app. Use a larger image or less zoom.
          </Alert>
        ) : null}
        {error ? (
          <Alert tone="error" className="w-full">
            {error}
          </Alert>
        ) : null}
      </div>
    </Modal>
  )
}
