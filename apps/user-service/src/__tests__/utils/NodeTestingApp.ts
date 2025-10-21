import {UserApiSpecification} from '@vexl-next/rest-api/src/services/user/specification'
import {createNodeTestingApp} from '@vexl-next/server-utils/src/tests/nodeTestingApp'

export const NodeTestingApp = createNodeTestingApp(UserApiSpecification)
