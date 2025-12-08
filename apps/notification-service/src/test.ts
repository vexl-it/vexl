import {NodeRuntime} from '@effect/platform-node/index'
import {Effect, Layer, pipe} from 'effect/index'

const foreverLayer = Layer.effectDiscard(Effect.sleep('20 seconds'))

const myLayer = Layer.effectDiscard(Effect.log('Starting Timeout Worker...'))

NodeRuntime.runMain(pipe(myLayer, Layer.merge(foreverLayer), Layer.launch))
