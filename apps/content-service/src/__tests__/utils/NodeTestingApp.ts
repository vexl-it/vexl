import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {createNodeTestingApp} from '@vexl-next/server-utils/src/tests/nodeTestingApp'

export const NodeTestingApp = createNodeTestingApp(ContentApiSpecification)
