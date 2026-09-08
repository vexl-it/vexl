import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import 'dotenv/config'
import {
  Array,
  Effect,
  Layer,
  Random,
  Schedule,
  Schema,
  Stream,
  SubscriptionRef,
  pipe,
} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {WebSocket} from 'ws'
import {
  ConnectionsCountByCountry,
  ConnectionsCountByCountryListMessage,
  DashboardBootstrappingMessage,
  NewUserWithConnectionsMessage,
  TotalUsersCountMessage,
  UserWithConnections,
} from '../../common/ServerMessage'
import {secureHash, type HasingSalt} from '../utils/hashPubKey'
import encodeAndSendMessage from './encodeAndSendMessage'
import {IncommingConnectionsStreamContext} from './serverSocket'

const dummyPrefixes = [
  420, 421, 1, 238, 49, 30, 33, 7, 41, 380, 355, 244, 36, 62, 60, 40,
]

const generateRandomUser = Effect.gen(function* () {
  const pubKey = yield* Effect.sync(
    () => generatePrivateKey().publicKeyPemBase64
  )

  const connections = yield* Random.nextIntBetween(50, 2000)

  const randomPrefixIndex = yield* Random.nextIntBetween(
    0,
    dummyPrefixes.length
  )
  const countryPrefix = yield* Schema.decodeEffect(CountryPrefix)(
    dummyPrefixes[randomPrefixIndex]
  )
  const receivedAt = unixMillisecondsNow()

  return new UserWithConnections({
    pubKey: yield* secureHash(pubKey),
    connectionsCount: connections,
    countryPrefix,
    receivedAt,
  })
})

const generateDummyCountriesScore = Effect.gen(function* () {
  const decodePrexies = Schema.decodeEffect(Schema.Array(CountryPrefix))
  const prefixes = yield* decodePrexies(dummyPrefixes)
  const scores = yield* Effect.all(
    prefixes.map(() => Random.nextIntBetween(5000, 500_000))
  )

  return Array.zip(prefixes, scores)
})

const handleConnection = (
  c: WebSocket
): Effect.Effect<void, SchemaError, HasingSalt> =>
  Effect.gen(function* () {
    const usersRef = yield* pipe(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      Array.map(() => generateRandomUser),
      Effect.all,
      Effect.flatMap(SubscriptionRef.make<UserWithConnections[]>)
    )

    const countriesScoreRef = yield* SubscriptionRef.make<
      ConnectionsCountByCountry[]
    >(
      (yield* generateDummyCountriesScore).map(
        ([code, count]) =>
          new ConnectionsCountByCountry({countryCode: code, count})
      )
    )

    const totalCountRef = yield* SubscriptionRef.make(0)

    const sendMessage = encodeAndSendMessage(c)

    yield* sendMessage(
      new DashboardBootstrappingMessage({
        status: 'ready',
        message: 'Dashboard data ready',
      })
    ).pipe(
      Effect.catch((error) =>
        Effect.logWarning(
          'Unable to send initial dashboard bootstrap message',
          error
        )
      )
    )

    const reportUsersChangeEffect = pipe(
      SubscriptionRef.changes(usersRef),
      Stream.runForEach((v) =>
        sendMessage(new NewUserWithConnectionsMessage({userWithConnections: v}))
      ),
      Effect.ignore
    )

    const reportCountriesChangeEffect = pipe(
      SubscriptionRef.changes(countriesScoreRef),
      Stream.runForEach((v) =>
        sendMessage(
          new ConnectionsCountByCountryListMessage({
            type: 'full',
            connectionsCountByCountryList: v,
          })
        )
      ),
      Effect.ignore
    )

    const reportNumberEffect = pipe(
      SubscriptionRef.changes(totalCountRef),
      Stream.runForEach((v) =>
        sendMessage(
          new TotalUsersCountMessage({
            totalUsersCount: v,
          })
        )
      ),
      Effect.ignore
    )

    const createNewUsersEffect = SubscriptionRef.updateEffect(
      usersRef,
      (users) =>
        generateRandomUser.pipe(
          Effect.map((v) => Array.prepend(users, v)),
          Effect.map(Array.take(10))
        )
    ).pipe(Effect.repeat(Schedule.spaced('10 second')))

    const incrementCountriesEffect = SubscriptionRef.updateEffect(
      countriesScoreRef,
      (countries) =>
        Effect.gen(function* () {
          const elementToUpdate = yield* Random.nextIntBetween(
            0,
            countries.length
          )

          const toAdd = yield* Random.nextIntBetween(50_000, 300_000)

          return Array.map(countries, (value, index) =>
            index === elementToUpdate
              ? new ConnectionsCountByCountry({
                  ...value,
                  count: value.count + toAdd,
                })
              : value
          )
        })
    ).pipe(Effect.repeat(Schedule.spaced('5 second')))

    const incrementUsersCountEffect = SubscriptionRef.updateEffect(
      totalCountRef,
      (users) => Random.nextIntBetween(1, 10).pipe(Effect.map((v) => v + users))
    ).pipe(Effect.repeat(Schedule.spaced('5 seconds')))

    const connectionCloseEffect = Effect.callback((callback) => {
      c.onclose = () => {
        callback(Effect.void)
      }
      if (c.readyState === WebSocket.CLOSED) {
        callback(Effect.void)
      }
    })

    yield* Effect.log('Got connection, running dummy updates')
    const parallerEffects = [
      reportUsersChangeEffect,
      reportCountriesChangeEffect,
      reportNumberEffect,
      createNewUsersEffect,
      connectionCloseEffect,
      incrementCountriesEffect,
      incrementUsersCountEffect,
    ]

    yield* Effect.raceAll(parallerEffects)
    yield* Effect.log('Connection closed')
  })

export const DebugSocketServerLive = Layer.effectDiscard(
  IncommingConnectionsStreamContext.pipe(
    Effect.tap(Effect.log('Listening for connections')),
    Effect.flatMap(
      Stream.runForEach((connection) =>
        pipe(
          Effect.andThen(
            Effect.log(`Got connection`),
            handleConnection(connection)
          ),
          Effect.forkChild
        )
      )
    )
  )
).pipe(Layer.withSpan('DebugSocketServerLive'))
