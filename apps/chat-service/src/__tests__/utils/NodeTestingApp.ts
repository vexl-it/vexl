import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {Context, Layer, type Effect} from 'effect'
import {NodeTesting} from 'effect-http-node'
import {app} from '../../httpServer'

const nodeTestingAppEffect = NodeTesting.make(app, ChatApiSpecification)

export class NodeTestingApp extends Context.Tag('NodeTestingApp')<
  NodeTestingApp,
  Effect.Effect.Success<typeof nodeTestingAppEffect>
>() {
  static readonly Live = Layer.scoped(NodeTestingApp, nodeTestingAppEffect)
}
