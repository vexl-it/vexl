import {runMainInNode} from '@vexl-next/server-utils/src/runMainInNode'
import {Effect} from 'effect'
import {httpServer} from './httpServer'

runMainInNode(
  httpServer.pipe(
    Effect.zipLeft(Effect.log('Debug log', 'The server finished (WTF)?'))
  )
)
