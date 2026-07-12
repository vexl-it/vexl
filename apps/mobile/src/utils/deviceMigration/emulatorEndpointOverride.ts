/**
 * Applies the transient TCP host override only in development bundles. Keeping
 * this decision next to the connection call makes a production invocation a
 * no-op even if a caller accidentally supplies the optional argument.
 */
export function resolveMigrationEndpointHost(
  advertisedHost: string,
  overrideHost: string | undefined,
  development: boolean = __DEV__
): string {
  return development && overrideHost !== undefined
    ? overrideHost
    : advertisedHost
}
