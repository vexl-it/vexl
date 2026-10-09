import {ContentInternalApiSpecification} from '@vexl-next/rest-api/src/services/content/internalSpecification'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {
  createNodeTestingApp,
  createNodeTestingInternalApp,
} from '@vexl-next/server-utils/src/tests/nodeTestingApp'

export const NodeTestingApp = createNodeTestingApp(ContentApiSpecification)

export const NodeTestingInternalApp = createNodeTestingInternalApp(
  ContentInternalApiSpecification
)
