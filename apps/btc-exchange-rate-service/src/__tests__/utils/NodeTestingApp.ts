import {BtcExchangeRateServiceSpecification} from '@vexl-next/rest-api/src/services/btcExchangeRate/specification'
import {Context, Layer, type Effect} from 'effect'
import {NodeTesting} from 'effect-http-node'
import {app} from '../../httpServer'

const nodeTestingAppEffect = NodeTesting.make(
  app,
  BtcExchangeRateServiceSpecification
)

export class NodeTestingApp extends Context.Tag('NodeTestingApp')<
  NodeTestingApp,
  Effect.Effect.Success<typeof nodeTestingAppEffect>
>() {
  static readonly layer = Layer.scoped(NodeTestingApp, nodeTestingAppEffect)
}
