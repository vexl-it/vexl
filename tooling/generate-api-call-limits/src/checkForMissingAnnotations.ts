import * as NodeRuntime from '@effect/platform-node/NodeRuntime'
import {checkForMissingAnnotations} from '.'

NodeRuntime.runMain(checkForMissingAnnotations)
