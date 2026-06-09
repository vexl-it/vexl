import {tokens} from '@vexl-next/ui'

export const QR_SCANNER_TITLE_TOP_OFFSET = tokens.space[12].val
export const QR_SCANNER_TITLE_HEIGHT = 96
export const QR_SCANNER_TITLE_GAP = tokens.space[6].val
export const QR_SCANNER_BOTTOM_CONTROLS_HEIGHT = tokens.space[13].val
export const QR_SCANNER_MIN_WINDOW_SIZE = 120

interface GetQrScannerLayoutParams {
  readonly width: number
  readonly height: number
  readonly safeAreaTop: number
  readonly safeAreaBottom: number
  readonly horizontalPadding: number
  readonly sizeHeightRatio: number
  readonly preferredVerticalPosition: number
  readonly bottomControlsHeight?: number
}

export function getQrScannerLayout({
  width,
  height,
  safeAreaTop,
  safeAreaBottom,
  horizontalPadding,
  sizeHeightRatio,
  preferredVerticalPosition,
  bottomControlsHeight = QR_SCANNER_BOTTOM_CONTROLS_HEIGHT,
}: GetQrScannerLayoutParams): {
  readonly titleTop: number
  readonly titleHeight: number
  readonly scanWindow: {
    readonly size: number
    readonly x: number
    readonly y: number
  }
} {
  const titleTop = safeAreaTop + QR_SCANNER_TITLE_TOP_OFFSET
  const minimumScanWindowTop =
    titleTop + QR_SCANNER_TITLE_HEIGHT + QR_SCANNER_TITLE_GAP
  const bottomControlsTop = height - safeAreaBottom - bottomControlsHeight
  const availableScanHeight = Math.max(
    0,
    bottomControlsTop - minimumScanWindowTop
  )

  const size = Math.max(
    QR_SCANNER_MIN_WINDOW_SIZE,
    Math.min(
      width - horizontalPadding,
      height * sizeHeightRatio,
      availableScanHeight
    )
  )
  const maximumScanWindowTop = bottomControlsTop - size
  const preferredScanWindowTop = height * preferredVerticalPosition
  const scanWindowTop = Math.max(
    minimumScanWindowTop,
    Math.min(preferredScanWindowTop, maximumScanWindowTop)
  )

  return {
    titleTop,
    titleHeight: QR_SCANNER_TITLE_HEIGHT,
    scanWindow: {
      size,
      x: (width - size) / 2,
      y: scanWindowTop,
    },
  }
}
