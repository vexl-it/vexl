import {HttpApiBuilder} from '@effect/platform/index'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe} from 'effect/index'
import {
  hashForClient,
  serverHashPhoneNumber,
} from '../../utils/serverHashContact'

export const convertPhoneNumberHashesToServerHashes = HttpApiBuilder.handler(
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
      Effect.allWith({concurrency: 'unbounded'}),
      Effect.map((result) => ({result})),
      Effect.withSpan('ConvertPhoneNumberHashesToServerHashes'),
      makeEndpointEffect
    )
)
