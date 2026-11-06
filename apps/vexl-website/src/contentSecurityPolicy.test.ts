import {describe, expect, it} from 'vitest'
import {contentSecurityPolicies} from './contentSecurityPolicy'

const scriptSources = (policy: string): string | undefined =>
  policy
    .split(';')
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith('script-src '))

describe('contentSecurityPolicies', () => {
  it('enforces the nonce and the own-origin script policy together', () => {
    const {withNonce, enforced} = contentSecurityPolicies('abc')
    const policies = enforced.split(',').map((policy) => policy.trim())

    expect(policies).toHaveLength(2)
    expect(policies[0]).toBe(withNonce)
    expect(scriptSources(policies[0] ?? '')).toBe(
      "script-src 'self' 'nonce-abc'"
    )
    expect(scriptSources(policies[1] ?? '')).toBe(
      "script-src 'self' 'unsafe-inline'"
    )
  })
})
