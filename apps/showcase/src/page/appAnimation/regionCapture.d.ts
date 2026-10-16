// Chromium's Region Capture and tab capture hints, missing from TypeScript's DOM lib.

interface DisplayMediaStreamOptions {
  preferCurrentTab?: boolean
  selfBrowserSurface?: 'include' | 'exclude'
}

interface CropTarget {
  readonly brand: 'CropTarget'
}

interface MediaStreamTrack {
  cropTo: (target: CropTarget) => Promise<void>
}

// eslint-disable-next-line no-var
declare var CropTarget:
  | {fromElement: (element: Element) => Promise<CropTarget>}
  | undefined
