import {MetricsApiSpecification} from '@vexl-next/rest-api/src/services/metrics/specification'
import {createNodeTestingApp} from '@vexl-next/server-utils/src/tests/nodeTestingApp'

export const NodeTestingApp = createNodeTestingApp(MetricsApiSpecification)
