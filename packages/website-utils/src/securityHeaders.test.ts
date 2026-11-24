import {Array, Option, pipe} from 'effect'
import {describe, expect, it} from 'vitest'
import {contentSecurityPolicies} from './securityHeaders'

const directive = (policy: string, name: string): Option.Option<string> =>
  pipe(
    policy.split(';'),
    Array.map((part) => part.trim()),
    Array.findFirst((part) => part.startsWith(`${name} `))
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
    expect(directive(policies[0] ?? '', 'script-src')).toEqual(
      Option.some("script-src 'self' 'nonce-abc'")
    )
    expect(directive(policies[1] ?? '', 'script-src')).toEqual(
      Option.some("script-src 'self' 'unsafe-inline'")
    )
  })

  it('allows only our own origin unless a site lists others', () => {
    const own = contentSecurityPolicies('abc').withNonce
    expect(directive(own, 'img-src')).toEqual(Option.some("img-src 'self'"))
    expect(directive(own, 'frame-src')).toEqual(Option.none())

    const external = contentSecurityPolicies('abc', {
      img: ['https://img.example'],
      frame: ['https://frame.example'],
    }).withNonce
    expect(directive(external, 'img-src')).toEqual(
      Option.some("img-src 'self' https://img.example")
    )
    expect(directive(external, 'frame-src')).toEqual(
      Option.some('frame-src https://frame.example')
    )
  })
})
