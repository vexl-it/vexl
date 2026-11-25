import {Effect} from 'effect'
import {
  decapsulateRequest,
  encapsulateRequest,
  generateGatewayKey,
} from './ohttp'
import {OhttpKeyConfig} from './ohttp.brand'

const plaintext = new TextEncoder().encode('{"hello":"gateway"}')

describe('ohttp', () => {
  it('round-trips a request through encapsulation and decapsulation', async () => {
    const {keyConfig, gatewaySecret} = await Effect.runPromise(
      generateGatewayKey(7)
    )
    const request = await Effect.runPromise(
      encapsulateRequest({keyConfig, plaintext})
    )
    const opened = await Effect.runPromise(
      decapsulateRequest({gatewaySecrets: [gatewaySecret], request})
    )

    expect(request[0]).toBe(7)
    expect(new TextDecoder().decode(opened)).toBe('{"hello":"gateway"}')
  })

  it('picks the gateway key by key id', async () => {
    const current = await Effect.runPromise(generateGatewayKey(1))
    const next = await Effect.runPromise(generateGatewayKey(2))
    const request = await Effect.runPromise(
      encapsulateRequest({keyConfig: next.keyConfig, plaintext})
    )

    const opened = await Effect.runPromise(
      decapsulateRequest({
        gatewaySecrets: [current.gatewaySecret, next.gatewaySecret],
        request,
      })
    )
    expect(opened).toEqual(plaintext)
  })

  it('fails with OhttpUnknownKeyError for a key id the gateway does not hold', async () => {
    const client = await Effect.runPromise(generateGatewayKey(1))
    const gateway = await Effect.runPromise(generateGatewayKey(2))
    const request = await Effect.runPromise(
      encapsulateRequest({keyConfig: client.keyConfig, plaintext})
    )

    const result = await Effect.runPromise(
      Effect.flip(
        decapsulateRequest({gatewaySecrets: [gateway.gatewaySecret], request})
      )
    )
    expect(result).toMatchObject({_tag: 'OhttpUnknownKeyError', keyId: 1})
  })

  it('fails with OhttpDecapsulationError for a tampered request', async () => {
    const {keyConfig, gatewaySecret} = await Effect.runPromise(
      generateGatewayKey(1)
    )
    const request = await Effect.runPromise(
      encapsulateRequest({keyConfig, plaintext})
    )
    request[request.length - 1] = (request[request.length - 1] ?? 0) ^ 1

    const result = await Effect.runPromise(
      Effect.flip(
        decapsulateRequest({gatewaySecrets: [gatewaySecret], request})
      )
    )
    expect(result).toMatchObject({_tag: 'OhttpDecapsulationError'})
  })

  it('rejects a key config for another suite', async () => {
    const result = await Effect.runPromise(
      Effect.flip(
        encapsulateRequest({
          keyConfig: OhttpKeyConfig.make(Buffer.alloc(41).toString('base64')),
          plaintext,
        })
      )
    )
    expect(result).toMatchObject({_tag: 'OhttpInvalidKeyError'})
  })

  it('works without WebCrypto subtle, as in Hermes', async () => {
    const subtle = Object.getOwnPropertyDescriptor(globalThis.crypto, 'subtle')
    Object.defineProperty(globalThis.crypto, 'subtle', {
      value: undefined,
      configurable: true,
    })
    try {
      const {keyConfig, gatewaySecret} = await Effect.runPromise(
        generateGatewayKey(1)
      )
      const request = await Effect.runPromise(
        encapsulateRequest({keyConfig, plaintext})
      )
      const opened = await Effect.runPromise(
        decapsulateRequest({gatewaySecrets: [gatewaySecret], request})
      )
      expect(opened).toEqual(plaintext)
    } finally {
      if (subtle) Object.defineProperty(globalThis.crypto, 'subtle', subtle)
      else Reflect.deleteProperty(globalThis.crypto, 'subtle')
    }
  })
})
