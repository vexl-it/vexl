import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Array, Effect, pipe} from 'effect'
import {
  hashForClient,
  serverHashPhoneNumber,
} from '../../utils/serverHashContact'

export const convertPhoneNumberHashesToServerHashes = makeHttpApiHandler(
  ContactApiSpecification,
  'Contact',
  'convertPhoneNumberHashesToServerHashes',
  (req) =>
    pipe(
      req.payload.hashedPhoneNumbers,
      Array.map((hashedNumber) =>
        pipe(
          serverHashPhoneNumber(hashedNumber),
          Effect.flatMap(hashForClient),
          Effect.map((serverToClientHash) => ({
            hashedNumber,
            serverToClientHash,
          }))
        )
      ),
      (effects) => Effect.all(effects, {concurrency: 'unbounded'}),
      Effect.map((result) => ({result})),
      Effect.withSpan('ConvertPhoneNumberHashesToServerHashes'),
      makeEndpointEffect
    )
)
