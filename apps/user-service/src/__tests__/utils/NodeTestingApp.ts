import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {Context, Layer, type Effect} from 'effect'
import {NodeTesting} from 'effect-http-node'
import {app} from '../../httpServer'

const nodeTestingAppEffect = NodeTesting.make(app, UserApiSpecification)

export class NodeTestingApp extends Context.Tag('NodeTestingApp')<
  NodeTestingApp,
  Effect.Effect.Success<typeof nodeTestingAppEffect>
>() {
  static readonly layer = Layer.scoped(NodeTestingApp, nodeTestingAppEffect)
}
