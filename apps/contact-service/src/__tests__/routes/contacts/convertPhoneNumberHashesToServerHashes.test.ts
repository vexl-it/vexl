import {HttpClient, HttpClientRequest} from '@effect/platform'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Array, Effect, pipe, Schema} from 'effect/index'
import {
  hashForClient,
  serverHashPhoneNumber,
} from '../../../utils/serverHashContact'
import {NodeTestingApp} from '../../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../../utils/runPromiseInMockedEnvironment'
import {generateKeysAndHasheForNumber} from './utils'

it('Converts phone number hashes to server hashes', async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const somePhoneNumbers = yield* _(
        ['+420733333001', '+420733333002', '+420733333003'],
        Array.map((numberString) =>
          pipe(
            numberString,
            Schema.decode(E164PhoneNumber),
            Effect.flatMap(hashPhoneNumber)
          )
        ),
        Effect.all
      )

      const expectedResult = yield* _(
        somePhoneNumbers,
        Array.map((number) =>
          pipe(
            number,
            serverHashPhoneNumber,
            Effect.flatMap(hashForClient),
            Effect.map((serverToClientHash) => ({
              hashedNumber: number,
              serverToClientHash,
            }))
          )
        ),
        Effect.all
      )

      const me = yield* _(generateKeysAndHasheForNumber('+420733333001'))

      yield* _(setAuthHeaders(me.authHeaders))
      const client = yield* _(
        NodeTestingApp,
        Effect.flatMap((app) =>
          app.Contact.convertPhoneNumberHashesToServerHashes({
            payload: {hashedPhoneNumbers: somePhoneNumbers},
          })
        )
      )
      expect(client.result).toEqual(expectedResult)
    })
  )
})

it('Rejects server hashes with a 400', async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const me = yield* _(generateKeysAndHasheForNumber('+420733333001'))
      const client = yield* _(HttpClient.HttpClient)
      const convert = (hashedPhoneNumbers: readonly string[]) =>
        pipe(
          HttpClientRequest.post('/api/v1/contacts/convert-to-server-hashes'),
          HttpClientRequest.setHeaders({
            ...me.authHeaders,
            'user-agent': 'Vexl/1 (1.0.0) ANDROID',
          }),
          HttpClientRequest.bodyUnsafeJson({hashedPhoneNumbers}),
          client.execute
        )

      expect((yield* _(convert(['someHash']))).status).toBe(200)

      const rejected = yield* _(convert(['ServerHash:someHash']))
      expect(rejected.status).toBe(400)
      expect(yield* _(rejected.text)).not.toContain('ServerHash:someHash')
    })
  )
})
