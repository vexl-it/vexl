// Mobile-first breakpoints for web layouts. Unfolded Android foldables also
// match `sm`/`md`, so use media props only for web-specific layout.
export const media = {
  sm: {minWidth: 640},
  md: {minWidth: 768},
  lg: {minWidth: 1024},
  xl: {minWidth: 1280},
}

export const mediaQueryDefaultActive = {
  sm: false,
  md: false,
  lg: false,
  xl: false,
}
