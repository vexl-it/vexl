import {OfferApiSpecification} from '@vexl-next/rest-api/src/services/offer/specification'
import {Context, Layer, type Effect} from 'effect'
import {NodeTesting} from 'effect-http-node'
import {app} from '../../httpServer'

const nodeTestingAppEffect = NodeTesting.make(app, OfferApiSpecification)

export class NodeTestingApp extends Context.Tag('NodeTestingApp')<
  NodeTestingApp,
  Effect.Effect.Success<typeof nodeTestingAppEffect>
>() {
  static readonly Live = Layer.scoped(NodeTestingApp, nodeTestingAppEffect)
}
