import {Effect, Exit, Option, Stream} from 'effect'
import assert from 'node:assert/strict'
import {once} from 'node:events'
import {test} from 'node:test'
import {setImmediate} from 'node:timers/promises'
import {WebSocket, WebSocketServer} from 'ws'
import {
  createConnectionsStream,
  createMessagesStream,
  dataToString,
} from './utils'

void test(
  'websocket streams deliver messages and remove listeners on completion and cancellation',
  {timeout: 10000},
  async () => {
    const server = new WebSocketServer({host: '127.0.0.1', port: 0})
    await once(server, 'listening')
    const address = server.address()
    assert.ok(typeof address === 'object' && address !== null)
    const nextConnection = Effect.runPromise(
      createConnectionsStream(server).pipe(Stream.runHead)
    )
    const client = new WebSocket(`ws://127.0.0.1:${address.port}`)
    try {
      await once(client, 'open')
      const connection = await nextConnection
      assert.ok(Option.isSome(connection))
      const socket = connection.value
      assert.equal(server.listenerCount('connection'), 0)
      assert.equal(server.listenerCount('error'), 0)

      const messages = Effect.runPromise(
        createMessagesStream(socket).pipe(
          Stream.mapEffect(dataToString),
          Stream.take(3),
          Stream.runCollect
        )
      )
      client.send('first')
      client.send('second')
      client.send('third')
      assert.deepEqual(await messages, ['first', 'second', 'third'])
      assert.equal(socket.listenerCount('message'), 0)

      const abort = new AbortController()
      const canceled = Effect.runPromiseExit(
        createMessagesStream(socket).pipe(Stream.runDrain),
        {signal: abort.signal}
      )
      await setImmediate()
      assert.equal(socket.listenerCount('message'), 1)
      abort.abort()
      assert.ok(Exit.isFailure(await canceled))
      assert.equal(socket.listenerCount('message'), 0)
      assert.equal(socket.listenerCount('error'), 0)

      const closed = Effect.runPromise(
        createMessagesStream(socket).pipe(Stream.runCollect)
      )
      client.close()
      assert.deepEqual(await closed, [])
      assert.equal(socket.listenerCount('message'), 0)
    } finally {
      client.terminate()
      for (const socket of server.clients) socket.terminate()
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error)
          else resolve()
        })
      })
    }
  }
)
