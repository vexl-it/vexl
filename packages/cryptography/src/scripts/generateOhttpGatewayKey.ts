import {Console, Effect} from 'effect'
import {generateGatewayKey} from '../operations/ohttp'

const keyId = Number(process.argv[2] ?? 1)

void Effect.runPromise(
  generateGatewayKey(keyId).pipe(
    Effect.flatMap(({keyConfig, gatewaySecret}) =>
      Console.log(
        [
          `Key id: ${keyId}`,
          `Client key config (public, ships in the app): ${keyConfig}`,
          `Gateway secret (metrics-service ANALYTICS_OHTTP_GATEWAY_SECRETS): ${gatewaySecret}`,
        ].join('\n')
      )
    )
  )
)
