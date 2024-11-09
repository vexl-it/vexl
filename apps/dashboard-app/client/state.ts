import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {
  Array,
  Effect,
  Fiber,
  HashMap,
  Match,
  Option,
  Order,
  Schedule,
  Schema,
  Stream,
  pipe,
} from 'effect'
import {atom} from 'jotai'
import {
  ConnectionsCountByCountry,
  UserWithConnections,
  type ServerMessage,
} from '../common/ServerMessage'
import {createAndConnectSocket} from './utils/socket'

export const countriesConnectionOrder: Order.Order<ConnectionsCountByCountry> =
  Order.reverse(Order.struct({'count': Order.number}))

export const totalNumberOfUsersAtom = atom<Option.Option<number>>(Option.none())

export const countriesConnectionsHashMapAtom = atom<
  HashMap.HashMap<CountryPrefix, number>
>(HashMap.empty())

export const countriesToConnectionOrderedCount = atom((get) =>
  pipe(
    get(countriesConnectionsHashMapAtom),
    HashMap.toEntries,
    Array.map(
      ([countryCode, count]) =>
        new ConnectionsCountByCountry({countryCode, count})
    ),
    Array.sort(countriesConnectionOrder)
  )
)

export const maxCountryConnectionsCount = atom((get) =>
  pipe(
    get(countriesToConnectionOrderedCount),
    Array.head,
    Option.map((a) => a.count),
    Option.getOrElse(() => 0)
  )
)

export const countriesToConnectionCountArrayAtom = atom((get) =>
  pipe(get(countriesToConnectionOrderedCount))
)

const UsersWithConenctions = Schema.mutable(Schema.Array(UserWithConnections))
type UsersWithConenctions = Schema.Schema.Type<typeof UsersWithConenctions>

export const lastUsersAtom = atom<UsersWithConenctions>([])

type ConnectionState =
  | {
      _tag: 'Connected'
    }
  | {_tag: 'Connecting'}
  | {_tag: 'Error-Reconnecting'}

export const connectionStateAtom = atom<ConnectionState>({_tag: 'Connecting'})

export const listenForChangesActionAtom = atom(null, (get, set) => {
  const processSpecificMessage = Match.type<ServerMessage>().pipe(
    Match.tag('ConnectionsCountByCountryListMessage', (m) =>
      Effect.sync(() => {
        set(
          countriesConnectionsHashMapAtom,
          pipe(
            m.connectionsCountByCountryList,
            Array.map((v) => [v.countryCode, v.count] as const),
            HashMap.fromIterable
          )
        )
      })
    ),
    Match.tag('NewUserWithConnectionsMessage', (m) =>
      Effect.sync(() => {
        const lastUsers = get(lastUsersAtom)

        pipe(
          Array.difference<UserWithConnections>(
            m.userWithConnections,
            lastUsers
          ),
          Array.head,
          Option.tap((u) => {
            set(showConffetiForUserActionAtom, u)
            return Option.void
          })
        )

        set(lastUsersAtom, [...m.userWithConnections])
      })
    ),
    Match.tag('TotalUsersCountMessage', (m) =>
      Effect.sync(() => {
        set(totalNumberOfUsersAtom, Option.some(m.totalUsersCount))
      })
    ),
    Match.tag('DebugMessage', (m) =>
      Effect.logDebug('Debug message received', m)
    ),
    Match.tag('PongMessage', (m) =>
      Effect.logDebug('Pong message received', m)
    ),
    Match.tag('ReceivedUnexpectedMessage', (m) =>
      Effect.logWarning('Server got unexpected message', m)
    ),
    Match.tag('TimeoutClose', (m) =>
      Effect.logWarning('Closed due to timeout', m)
    ),
    Match.exhaustive
  )

  const fiber = createAndConnectSocket('/websocket').pipe(
    Effect.map((s) => s.messagesStream),
    Effect.tap(() =>
      Effect.sync(() => {
        set(connectionStateAtom, {_tag: 'Connected'})
      })
    ),
    Stream.unwrap,
    Stream.runForEach(processSpecificMessage),
    Effect.tapBoth({
      onSuccess: () => Effect.log('Socket closed.'),
      onFailure: (e) => Effect.logError('Error while reading socket', e),
    }),
    Effect.scoped,
    Effect.zipLeft(
      Effect.all([
        Effect.log('Retrying socket connection'),
        Effect.sync(() => {
          set(connectionStateAtom, {_tag: 'Error-Reconnecting'})
        }),
      ])
    ),
    Effect.ignore,
    Effect.repeat(Schedule.spaced('1 second')), // Retry on whatever happens
    Effect.runFork
  )

  return () => {
    Effect.runFork(
      Effect.zip(
        Fiber.interrupt(fiber),
        Effect.log('Interrupting socket connection')
      )
    )
  }
})

export const showConfettiAtom = atom<Option.Option<UserWithConnections>>(
  Option.none()
)
export const showConffetiForUserActionAtom = atom(
  null,
  (get, set, user: UserWithConnections) => {
    set(showConfettiAtom, (v) => {
      if (Option.isSome(v)) return v

      return Option.some(user) // Do not update if there is still animation in progress
    })
  }
)
