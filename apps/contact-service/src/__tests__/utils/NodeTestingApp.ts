import {ContactInternalApiSpecification} from '@vexl-next/rest-api/src/services/contact/internalSpecification'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {
  createNodeTestingApp,
  createNodeTestingInternalApp,
} from '@vexl-next/server-utils/src/tests/nodeTestingApp'

// .env.test sets ADMIN_TOKEN_HASH to its sha256
export const TEST_ADMIN_TOKEN = 'dev'

export const NodeTestingApp = createNodeTestingApp(ContactApiSpecification)

export const NodeTestingInternalApp = createNodeTestingInternalApp(
  ContactInternalApiSpecification,
  TEST_ADMIN_TOKEN
)
