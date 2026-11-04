import * as NodeSdk from '@effect/opentelemetry/NodeSdk'
import {
  HttpClient,
  HttpClientRequest,
  HttpRouter,
  HttpServer,
  HttpServerResponse,
} from '@effect/platform'
import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import {Array, Effect, Layer, pipe, String} from 'effect'
import {scrubbingSpanProcessor} from '../scrubbingSpanProcessor'

const exporter = new InMemorySpanExporter()

const TestServerLive = HttpRouter.empty.pipe(
  HttpRouter.get(
    '/offers',
    HttpServerResponse.empty({headers: {'x-session-secret': 'secret'}})
  ),
  HttpServer.serve(),
  Layer.provideMerge(NodeHttpServer.layerTest)
)

const TracingLive = NodeSdk.layer(() => ({
  resource: {serviceName: 'test'},
  spanProcessor: scrubbingSpanProcessor(new SimpleSpanProcessor(exporter)),
}))

describe('scrubbingSpanProcessor', () => {
  it('keeps only allowlisted headers and drops the URL query from HTTP spans', async () => {
    const spans = await Effect.runPromise(
      HttpClient.execute(
        HttpClientRequest.get('/offers?adminIds=secret').pipe(
          HttpClientRequest.setHeaders({
            'public-key': 'pk',
            hash: 'hash',
            signature: 'signature',
            'cf-connecting-ip': '1.2.3.4',
            'x-admin-token': 'token',
            'client-version': '42',
          })
        )
      ).pipe(
        Effect.scoped,
        // the exporter forgets its spans on shutdown, so read them before the layer closes
        Effect.map(() => exporter.getFinishedSpans()),
        Effect.provide(TestServerLive),
        Effect.provide(TracingLive)
      )
    )

    expect(spans).toHaveLength(2)

    Array.forEach(spans, (span) => {
      const attributeNames = Object.keys(span.attributes)
      const headerAttributes = pipe(
        Object.entries(span.attributes),
        Array.filter(([name]) => String.includes('.header.')(name))
      )

      expect(attributeNames).not.toContain('url.full')
      expect(attributeNames).not.toContain('url.query')
      expect(attributeNames).toContain('url.path')
      expect(headerAttributes).toEqual([
        ['http.request.header.client-version', '42'],
      ])
    })
  })
})
