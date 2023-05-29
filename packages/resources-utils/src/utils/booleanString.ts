export function booleanToString(val: boolean): 'true' | 'false' {
  if (val) return 'true'
  return 'false'
}

export function stringToBoolean(val: string): boolean {
  return val === 'true'
}
