import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {Context, Layer, type Effect} from 'effect'
import {NodeTesting} from 'effect-http-node'
import {app} from '../../httpServer'

const nodeTestingAppEffect = NodeTesting.make(app, ContentApiSpecification)

export class NodeTestingApp extends Context.Tag('NodeTestingApp')<
  NodeTestingApp,
  Effect.Effect.Success<typeof nodeTestingAppEffect>
>() {
  static readonly Live = Layer.scoped(NodeTestingApp, nodeTestingAppEffect)
}
