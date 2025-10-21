import {LocationApiSpecification} from '@vexl-next/rest-api/src/services/location/specification'
import {createNodeTestingApp} from '@vexl-next/server-utils/src/tests/nodeTestingApp'

export const NodeTestingApp = createNodeTestingApp(LocationApiSpecification)
