import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {createNodeTestingApp} from '@vexl-next/server-utils/src/tests/nodeTestingApp'

export const NodeTestingApp = createNodeTestingApp(ContactApiSpecification)
