import {Array, Effect, HashMap, Option, pipe} from 'effect'
import {useEffect, useState} from 'react'
import {type StoredContactWithComputedValues} from '../../state/contacts/domain'
import {getContactImageUri} from '../../state/contacts/getContactImageUri'

const resolveContactImage = (
  contact: StoredContactWithComputedValues
): Effect.Effect<{hash: string; uri: string} | null> =>
  Option.match(contact.info.nonUniqueContactId, {
    onNone: () => Effect.succeed(null),
    onSome: (id) =>
      pipe(
        Effect.tryPromise(() => getContactImageUri(id)),
        Effect.map((uri) =>
          uri ? {hash: contact.computedValues.hash, uri} : null
        ),
        Effect.catchAll(() => Effect.succeed(null))
      ),
  })

export default function useContactImageSources(
  contacts: readonly StoredContactWithComputedValues[]
): HashMap.HashMap<string, {uri: string}> {
  const [sources, setSources] = useState<
    HashMap.HashMap<string, {uri: string}>
  >(HashMap.empty())

  useEffect(() => {
    const fiber = pipe(
      contacts,
      Effect.forEach(resolveContactImage, {concurrency: 5}),
      Effect.tap((results) => {
        setSources(
          HashMap.fromIterable(
            pipe(
              results,
              Array.filterMap(Option.fromNullable),
              Array.map((result) => [result.hash, {uri: result.uri}])
            )
          )
        )
      }),
      Effect.runFork
    )

    return () => {
      Effect.runFork(fiber.interruptAsFork(fiber.id()))
    }
  }, [contacts])

  return sources
}
