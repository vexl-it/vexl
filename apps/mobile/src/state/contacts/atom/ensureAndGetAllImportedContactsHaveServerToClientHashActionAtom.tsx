import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type ServerToClientHashedNumber} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {Array, Effect, HashMap, Option, pipe} from 'effect/index'
import {atom} from 'jotai'
import {apiAtom} from '../../../api'
import {importedContactsAtom, storedContactsAtom} from './contactsStore'

export const ensureAndGetAllImportedContactsHaveServerToClientHashActionAtom =
  atom(null, (get, set) =>
    Effect.gen(function* (_) {
      console.log(
        'ensureAllImportedContactsHaveServerToClientHashActionAtom',
        'Checking imported contacts for missing serverToClientHash'
      )
      const importedContactsWithoutServerToClientHash = pipe(
        get(importedContactsAtom),
        Array.filter(
          (contact) =>
            contact.flags.imported && Option.isNone(contact.serverHashToClient)
        )
      )

      if (Array.isNonEmptyArray(importedContactsWithoutServerToClientHash)) {
        console.log(
          'ensureAllImportedContactsHaveServerToClientHashActionAtom',
          'Found contacts to update:',
          importedContactsWithoutServerToClientHash.length
        )
        const api = get(apiAtom)

        console.log(
          'ensureAllImportedContactsHaveServerToClientHashActionAtom',
          'Fetching serverToClientHashes for contacts'
        )
        const fetchedContactsHashMap = yield* _(
          Array.map(
            importedContactsWithoutServerToClientHash,
            (c) => c.computedValues.hash
          ),
          Array.chunksOf(200),
          Array.map((chunk) =>
            api.contact
              .convertPhoneNumberHashesToServerHashes({
                hashedPhoneNumbers: chunk,
              })
              .pipe(
                Effect.map((one) => one.result),
                Effect.map(
                  Array.map(
                    ({hashedNumber, serverToClientHash}) =>
                      [hashedNumber, serverToClientHash] as const
                  )
                )
              )
          ),
          Effect.allWith({concurrency: 'unbounded'}),
          Effect.map(Array.flatten),
          Effect.map(
            HashMap.fromIterable<HashedPhoneNumber, ServerToClientHashedNumber>
          )
        )

        console.log(
          'ensureAllImportedContactsHaveServerToClientHashActionAtom',
          'Fetch done. Updating stored contacts.'
        )

        set(
          storedContactsAtom,
          Array.map((contact) => {
            if (Option.isNone(contact.computedValues)) {
              return contact
            }

            return {
              ...contact,
              serverHashToClient: pipe(
                HashMap.get(
                  fetchedContactsHashMap,
                  contact.computedValues.value.hash
                ),
                Option.orElse(() => contact.serverHashToClient)
              ),
            }
          })
        )

        console.log(
          'ensureAllImportedContactsHaveServerToClientHashActionAtom',
          'Fetched missing serverToClientHashes for imported contacts.'
        )
      }

      return pipe(
        get(importedContactsAtom),
        Array.filterMap((contact) =>
          contact.serverHashToClient.pipe(
            Option.map(
              (serverHashToClient) =>
                [serverHashToClient, contact.computedValues.hash] as const
            )
          )
        ),
        HashMap.fromIterable
      )
    })
  )
