import {runMainInNode} from '@vexl-next/server-utils/src/runMainInNode'
import {metricsServer} from './metricsServer'

console.log('pid: ', process.pid)
runMainInNode(metricsServer)
