// The app's gold, green and red from packages/ui, each >=3:1 on white. Joined
// and left also differ in lightness and sit on opposite sides of zero. The
// greys are the `line`, `line-strong` and `ink-subtle` tokens from globals.css.
export const CHART_PRIMARY = '#be8821'
export const CHART_POSITIVE = '#455749'
export const CHART_NEGATIVE = '#ee675e'
export const CHART_GRID = '#efedf3'
export const CHART_AXIS = '#d6d4db'
export const CHART_MUTED = '#8a8a8a'

// Gold ramp, light to dark, for heatmap cells
export const CHART_SEQUENTIAL = [
  '#f6ead2',
  '#ebd3a4',
  '#dcb874',
  '#be8821',
  '#946a1a',
  '#6b4c12',
] as const
