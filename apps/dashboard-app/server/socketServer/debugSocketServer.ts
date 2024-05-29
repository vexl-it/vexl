import {Schema} from '@effect/schema'
import {type ParseError} from '@effect/schema/ParseResult'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import 'dotenv/config'
import {
  Array,
  Effect,
  Layer,
  Random,
  Schedule,
  Stream,
  SubscriptionRef,
  pipe,
} from 'effect'
import {WebSocket} from 'ws'
import {
  ConnectionsCountByCountry,
  ConnectionsCountByCountryListMessage,
  NewUserWithConnectionsMessage,
  TotalUsersCountMessage,
  UserWithConnections,
} from '../../common/ServerMessage'
import encodeAndSendMessage from './encodeAndSendMessage'
import {IncommingConnectionsStreamContext} from './serverSocket'

const dummyPrefixes = [
  420, 421, 1, 238, 49, 30, 33, 7, 41, 380, 355, 244, 36, 62, 60, 40,
]

const generateRandomUser = Effect.gen(function* (_) {
  const pubKey = yield* _(
    Effect.sync(() => generatePrivateKey().publicKeyPemBase64)
  )

  const connections = yield* _(Random.nextIntBetween(50, 2000))

  const randomPrefixIndex = yield* _(
    Random.nextIntBetween(0, dummyPrefixes.length)
  )
  const countryPrefix = yield* _(
    Schema.decode(CountryPrefixE)(dummyPrefixes[randomPrefixIndex])
  )
  const receivedAt = unixMillisecondsNow()

  return new UserWithConnections({
    pubKey,
    connectionsCount: connections,
    countryPrefix,
    receivedAt,
  })
})

const generateDummyCountriesScore = Effect.gen(function* (_) {
  const decodePrexies = Schema.decode(Schema.Array(CountryPrefixE))
  const prefixes = yield* _(decodePrexies(dummyPrefixes))
  const scores = yield* _(
    Effect.all(prefixes.map(() => Random.nextIntBetween(5000, 500_000)))
  )

  return Array.zip(prefixes, scores)
})

const handleConnection = (
  c: WebSocket
): Effect.Effect<void, ParseError, never> =>
  Effect.gen(function* (_) {
    const usersRef = yield* _(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      Array.map(() => generateRandomUser),
      Effect.all,
      Effect.flatMap(SubscriptionRef.make<UserWithConnections[]>)
    )

    const countriesScoreRef = yield* _(
      SubscriptionRef.make<ConnectionsCountByCountry[]>(
        (yield* _(generateDummyCountriesScore)).map(
          ([code, count]) =>
            new ConnectionsCountByCountry({countryCode: code, count})
        )
      )
    )

    const totalCountRef = yield* _(SubscriptionRef.make(0))

    const sendMessage = encodeAndSendMessage(c)

    const reportUsersChangeEffect = pipe(
      usersRef.changes,
      Stream.runForEach((v) =>
        sendMessage(new NewUserWithConnectionsMessage({userWithConnections: v}))
      ),
      Effect.ignore
    )

    const reportCountriesChangeEffect = pipe(
      countriesScoreRef.changes,
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
      totalCountRef.changes,
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
        Effect.gen(function* (_) {
          const elementToUpdate = yield* _(
            Random.nextIntBetween(0, countries.length)
          )

          const toAdd = yield* _(Random.nextIntBetween(50_000, 300_000))

          return Array.modify(
            countries,
            elementToUpdate,
            (v) => new ConnectionsCountByCountry({...v, count: v.count + toAdd})
          )
        })
    ).pipe(Effect.repeat(Schedule.spaced('5 second')))

    const incrementUsersCountEffect = SubscriptionRef.updateEffect(
      totalCountRef,
      (users) => Random.nextIntBetween(1, 10).pipe(Effect.map((v) => v + users))
    ).pipe(Effect.repeat(Schedule.spaced('5 seconds')))

    const connectionCloseEffect = Effect.async((callback) => {
      c.onclose = () => {
        callback(Effect.void)
      }
      if (c.readyState === WebSocket.CLOSED) {
        callback(Effect.void)
      }
    })

    yield* _(Effect.log('Got connection, running dummy updates'))
    const parallerEffects = [
      reportUsersChangeEffect,
      reportCountriesChangeEffect,
      reportNumberEffect,
      createNewUsersEffect,
      connectionCloseEffect,
      incrementCountriesEffect,
      incrementUsersCountEffect,
    ]

    yield* _(Effect.raceAll(parallerEffects))
    yield* _(Effect.log('Connection closed'))
  })

export const DebugSocketServerLive = Layer.scopedDiscard(
  IncommingConnectionsStreamContext.pipe(
    Effect.zipLeft(Effect.log('Listening for connections')),
    Effect.flatMap(
      Stream.runForEach((connection) =>
        pipe(
          Effect.zipRight(
            Effect.log(`Got connection`),
            handleConnection(connection)
          ),
          Effect.fork
        )
      )
    )
  )
).pipe(Layer.withSpan('DebugSocketServerLive'))
