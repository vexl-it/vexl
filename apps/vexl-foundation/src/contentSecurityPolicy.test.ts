import {Array, Option, pipe} from 'effect'
import {describe, expect, it} from 'vitest'
import {contentSecurityPolicies} from './contentSecurityPolicy'

const scriptSources = (policy: string): Option.Option<string> =>
  pipe(
    policy.split(';'),
    Array.map((directive) => directive.trim()),
    Array.findFirst((directive) => directive.startsWith('script-src '))
  )

describe('contentSecurityPolicies', () => {
  it('enforces the nonce and the own-origin script policy together', () => {
    const {withNonce, enforced} = contentSecurityPolicies('abc')
    const policies = pipe(
      enforced.split(','),
      Array.map((policy) => policy.trim())
    )

    expect(policies).toHaveLength(2)
    expect(policies[0]).toBe(withNonce)
    expect(scriptSources(policies[0] ?? '')).toEqual(
      Option.some("script-src 'self' 'nonce-abc'")
    )
    expect(scriptSources(policies[1] ?? '')).toEqual(
      Option.some("script-src 'self' 'unsafe-inline'")
    )
  })
})
