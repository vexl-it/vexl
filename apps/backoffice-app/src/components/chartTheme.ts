// The app's gold, green and red from packages/ui, each >=3:1 on white. Joined
// and left also differ in lightness and sit on opposite sides of zero. The
// greys are the `line`, `line-strong` and `ink-subtle` tokens from globals.css.
export const CHART_PRIMARY = '#be8821'
export const CHART_POSITIVE = '#455749'
export const CHART_NEGATIVE = '#ee675e'
export const CHART_GRID = '#efedf3'
export const CHART_AXIS = '#d6d4db'
export const CHART_MUTED = '#8a8a8a'

export const CHART_BLUE = '#2a78d6'
export const CHART_RED = '#e34948'
export const CHART_ORANGE = '#eb6834'
export const CHART_NEUTRAL = '#9ca3af'
// Sequential blue ramp, light to dark, for heatmap cells
export const CHART_SEQUENTIAL = [
  '#cde2fb',
  '#9ec5f4',
  '#6da7ec',
  '#3987e5',
  '#256abf',
  '#184f95',
] as const
