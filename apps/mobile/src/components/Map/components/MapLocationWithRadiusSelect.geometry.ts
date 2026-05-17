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

export function calculateLongitudeRadiusDelta({
  centerLongitude,
  edgeLongitude,
}: {
  centerLongitude: number
  edgeLongitude: number
}): number {
  const longitudeRange = 360
  const halfLongitudeRange = longitudeRange / 2
  const rawDelta = Math.abs(centerLongitude - edgeLongitude)

  return rawDelta > halfLongitudeRange ? longitudeRange - rawDelta : rawDelta
}
