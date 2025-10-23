import {NodeRuntime} from '@effect/platform-node/index'
import {checkForMissingAnnotations} from '.'

NodeRuntime.runMain(checkForMissingAnnotations)
