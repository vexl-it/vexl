// Palette validated for CVD safety and >=3:1 contrast on white
export const CHART_BLUE = '#2a78d6'
export const CHART_RED = '#e34948'
export const CHART_GRID = '#e5e7eb'
export const CHART_AXIS = '#d1d5db'
export const CHART_MUTED = '#6b7280'

// Categorical slots, assigned in this order and never cycled
export const CHART_SERIES: readonly string[] = [
  CHART_BLUE,
  '#eb6834',
  '#1baf7a',
  '#eda100',
  '#e87ba4',
  '#008300',
  '#4a3aa7',
  CHART_RED,
]

// Ordinal blue ramp for ordered categories (funnel steps, buckets)
export const CHART_ORDINAL: readonly string[] = [
  '#86b6ef',
  '#6da7ec',
  '#5598e7',
  '#3987e5',
  '#2a78d6',
  '#256abf',
  '#1c5cab',
  '#104281',
]

// Pooled categories under the minimum group size
export const CHART_OTHER = '#c3c2b7'
