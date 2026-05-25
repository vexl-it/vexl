export interface Size {
  width: number
  height: number
}

export interface OverlayInsets {
  top: number
  bottom: number
  left: number
  right: number
}

export interface SelectionFrame {
  x: number
  y: number
  width: number
  height: number
  centerX: number
  centerY: number
}

export interface ZoomRange {
  min: number
  max: number
}

const worldTileSize = 256
const longitudeRange = 360

export function calculateAvailableSelectionFrame({
  container,
  overlays,
}: {
  container: Size
  overlays: OverlayInsets
}): SelectionFrame {
  const x = Math.min(container.width, Math.max(0, overlays.left))
  const y = Math.min(container.height, Math.max(0, overlays.top))
  const width = Math.max(0, container.width - overlays.left - overlays.right)
  const height = Math.max(0, container.height - overlays.top - overlays.bottom)

  return {
    x,
    y,
    width,
    height,
    centerX: x + width / 2,
    centerY: y + height / 2,
  }
}

export function calculateRingDiameter({
  frame,
  margin,
}: {
  frame: SelectionFrame
  margin: number
}): number {
  return Math.max(0, Math.min(frame.width, frame.height) - margin * 2)
}

export function calculateZoomFromLongitudeDelta({
  longitudeDelta,
  mapWidth,
}: {
  longitudeDelta: number
  mapWidth: number
}): number {
  if (!Number.isFinite(mapWidth) || mapWidth <= 0) return 0

  const boundedLongitudeDelta = Math.min(
    Math.max(Math.abs(longitudeDelta), Number.EPSILON),
    longitudeRange
  )

  return Math.log2(
    (longitudeRange * mapWidth) / (worldTileSize * boundedLongitudeDelta)
  )
}

export function calculateCenteredZoomRange({
  centerZoom,
  span,
  minZoom,
  maxZoom,
}: {
  centerZoom: number
  span: number
  minZoom: number
  maxZoom: number
}): ZoomRange {
  const absoluteMinZoom = Math.min(minZoom, maxZoom)
  const absoluteMaxZoom = Math.max(minZoom, maxZoom)
  const availableSpan = absoluteMaxZoom - absoluteMinZoom
  const boundedSpan = Math.max(0, Math.min(Math.abs(span), availableSpan))
  const boundedCenterZoom = Math.min(
    Math.max(centerZoom, absoluteMinZoom),
    absoluteMaxZoom
  )
  const halfSpan = boundedSpan / 2
  const centeredMinZoom = boundedCenterZoom - halfSpan
  const centeredMaxZoom = boundedCenterZoom + halfSpan

  if (centeredMinZoom < absoluteMinZoom) {
    return {
      min: absoluteMinZoom,
      max: absoluteMinZoom + boundedSpan,
    }
  }

  if (centeredMaxZoom > absoluteMaxZoom) {
    return {
      min: absoluteMaxZoom - boundedSpan,
      max: absoluteMaxZoom,
    }
  }

  return {
    min: centeredMinZoom,
    max: centeredMaxZoom,
  }
}

export function calculateAsymmetricZoomRange({
  initialZoom,
  zoomOut,
  zoomIn,
  minZoom,
  maxZoom,
}: {
  initialZoom: number
  zoomOut: number
  zoomIn: number
  minZoom: number
  maxZoom: number
}): ZoomRange {
  const absoluteMinZoom = Math.min(minZoom, maxZoom)
  const absoluteMaxZoom = Math.max(minZoom, maxZoom)
  const boundedInitialZoom = Math.min(
    Math.max(initialZoom, absoluteMinZoom),
    absoluteMaxZoom
  )

  return {
    min: Math.max(absoluteMinZoom, boundedInitialZoom - Math.max(0, zoomOut)),
    max: Math.min(absoluteMaxZoom, boundedInitialZoom + Math.max(0, zoomIn)),
  }
}

export function calculateZoomFromNormalizedSliderValue({
  sliderValue,
  initialZoom,
  zoomOut,
  zoomIn,
  minZoom,
  maxZoom,
}: {
  sliderValue: number
  initialZoom: number
  zoomOut: number
  zoomIn: number
  minZoom: number
  maxZoom: number
}): number {
  const sliderCenter = 0.5
  const boundedSliderValue = Math.min(Math.max(sliderValue, 0), 1)
  const absoluteMinZoom = Math.min(minZoom, maxZoom)
  const absoluteMaxZoom = Math.max(minZoom, maxZoom)
  const boundedInitialZoom = Math.min(
    Math.max(initialZoom, absoluteMinZoom),
    absoluteMaxZoom
  )

  if (boundedSliderValue <= sliderCenter) {
    const zoomOutProgress = (sliderCenter - boundedSliderValue) / sliderCenter
    return Math.max(
      absoluteMinZoom,
      boundedInitialZoom - Math.max(0, zoomOut) * zoomOutProgress
    )
  }

  const zoomInProgress = (boundedSliderValue - sliderCenter) / sliderCenter
  return Math.min(
    absoluteMaxZoom,
    boundedInitialZoom + Math.max(0, zoomIn) * zoomInProgress
  )
}

export function calculateLongitudeRadiusDelta({
  centerLongitude,
  edgeLongitude,
}: {
  centerLongitude: number
  edgeLongitude: number
}): number {
  const halfLongitudeRange = longitudeRange / 2
  const rawDelta = Math.abs(centerLongitude - edgeLongitude)

  return rawDelta > halfLongitudeRange ? longitudeRange - rawDelta : rawDelta
}
