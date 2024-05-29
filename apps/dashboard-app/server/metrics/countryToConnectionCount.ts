import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {Effect, HashMap, Option, Stream, pipe} from 'effect'
import {pubKeyToCountryPrefixChanges} from './pubKeyToCountry'
import {CountriesToConnectionsCountState} from './pubKeysToConnectionsCount'

function countByCountries(
  pubKeyToCount: HashMap.HashMap<PublicKeyPemBase64, number>,
  pubKeyToCountryPrefix: HashMap.HashMap<PublicKeyPemBase64, CountryPrefix>
): HashMap.HashMap<CountryPrefix, number> {
  return HashMap.reduce(
    pubKeyToCount,
    HashMap.empty<CountryPrefix, number>(),
    (acc, count, pubKey) =>
      pipe(
        pubKeyToCountryPrefix,
        HashMap.get(pubKey),
        Option.map((prefix) =>
          HashMap.modifyAt(
            acc,
            prefix,
            Option.match({
              onSome: (v) => Option.some(v + count),
              onNone: () => Option.some(count),
            })
          )
        ),
        Option.getOrElse(() => acc)
      )
  )
}

export const countriesToConnectionsCountChanges =
  CountriesToConnectionsCountState.pipe(
    Effect.map((a) => a.changes),
    Stream.unwrap,
    Stream.map((a) => a.pubKeyToConnectionsCount),
    Stream.changes,
    Stream.zipLatestWith(pubKeyToCountryPrefixChanges, countByCountries)
  )
