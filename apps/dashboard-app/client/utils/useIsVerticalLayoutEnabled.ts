export function useIsVerticalLayoutEnabled(): boolean {
  // check if url contains #vertical-enabled. Make this with hook:
  return window?.location?.hash?.includes('#vertical') ?? false
}
