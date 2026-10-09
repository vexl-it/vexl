import {ContactInternalApiSpecification} from '@vexl-next/rest-api/src/services/contact/internalSpecification'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {
  createNodeTestingApp,
  createNodeTestingInternalApp,
} from '@vexl-next/server-utils/src/tests/nodeTestingApp'

export const NodeTestingApp = createNodeTestingApp(ContactApiSpecification)

export const NodeTestingInternalApp = createNodeTestingInternalApp(
  ContactInternalApiSpecification
)
