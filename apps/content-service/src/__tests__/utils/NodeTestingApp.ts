import {HttpClient} from '@effect/platform/index'
import {ContentInternalApiSpecification} from '@vexl-next/rest-api/src/services/content/internalSpecification'
import {ContentApiSpecification} from '@vexl-next/rest-api/src/services/content/specification'
import {
  createNodeTestingApp,
  createNodeTestingInternalApp,
  InternalServerTestClient,
} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect} from 'effect'

// .env.test sets ADMIN_TOKEN_HASH to its sha256
export const TEST_ADMIN_TOKEN = 'dev'

export const NodeTestingApp = createNodeTestingApp(ContentApiSpecification)

export const NodeTestingInternalApp = createNodeTestingInternalApp(
  ContentInternalApiSpecification,
  TEST_ADMIN_TOKEN
)

// Calls the internal server without the admin token, like the websites do
export const NodeTestingInternalAppWithoutToken = createNodeTestingApp(
  ContentInternalApiSpecification
).pipe(
  Effect.provideServiceEffect(HttpClient.HttpClient, InternalServerTestClient)
)
