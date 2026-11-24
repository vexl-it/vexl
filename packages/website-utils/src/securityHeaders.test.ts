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
    expect(directive(own, 'connect-src')).toEqual(
      Option.some("connect-src 'self'")
    )

    const {withNonce: external, enforced} = contentSecurityPolicies('abc', {
      script: ['https://script.example'],
      img: ['https://img.example'],
      frame: ['https://frame.example'],
      connect: ['https://connect.example'],
    })
    expect(directive(external, 'script-src')).toEqual(
      Option.some("script-src 'self' 'nonce-abc' https://script.example")
    )
    expect(directive(enforced.split(',')[1] ?? '', 'script-src')).toEqual(
      Option.some("script-src 'self' 'unsafe-inline' https://script.example")
    )
    expect(directive(external, 'img-src')).toEqual(
      Option.some("img-src 'self' https://img.example")
    )
    expect(directive(external, 'frame-src')).toEqual(
      Option.some('frame-src https://frame.example')
    )
    expect(directive(external, 'connect-src')).toEqual(
      Option.some("connect-src 'self' https://connect.example")
    )
  })
})
