import {ChatApiSpecification} from '@vexl-next/rest-api/src/services/chat/specification'
import {createNodeTestingApp} from '@vexl-next/server-utils/src/tests/nodeTestingApp'

export const NodeTestingApp = createNodeTestingApp(ChatApiSpecification)
