import fastDeepEqual from 'fast-deep-equal'

export function fastDeepEqualRemoveUndefineds<T extends object>(
  first: T,
  second: T
): boolean {
  const firstNoUndefineds = Object.fromEntries(
    Object.entries(first).filter(([_, v]) => v !== undefined)
  )

  const secondNoUndefineds = Object.fromEntries(
    Object.entries(second).filter(([_, v]) => v !== undefined)
  )

  return fastDeepEqual(firstNoUndefineds, secondNoUndefineds)
}
